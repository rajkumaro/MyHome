# MyHome - AWS Deployment Guide

Deploy MyHome to AWS using EC2, Application Load Balancer, and CloudFormation.

## Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate permissions
- [AWS Account](https://aws.amazon.com/free/)
- An EC2 Key Pair created in your AWS region
- A domain name (optional)

## Option 1: CloudFormation (Recommended)

### Deploy the CloudFormation stack

```bash
# Deploy with HTTP only
aws cloudformation deploy \
  --template-file deployment/aws/cloudformation.yml \
  --stack-name myhome-prod \
  --parameter-overrides \
    EnvironmentName=prod \
    InstanceType=t3.small \
    KeyName=your-key-pair-name \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# Deploy with HTTPS (requires SSL certificate in ACM)
aws cloudformation deploy \
  --template-file deployment/aws/cloudformation.yml \
  --stack-name myhome-prod \
  --parameter-overrides \
    EnvironmentName=prod \
    InstanceType=t3.small \
    KeyName=your-key-pair-name \
    SSLCertificateArn=arn:aws:acm:us-east-1:123456789:certificate/abc-def \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

### Get the Load Balancer URL

```bash
aws cloudformation describe-stacks \
  --stack-name myhome-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text
```

### Delete the stack

```bash
aws cloudformation delete-stack --stack-name myhome-prod
```

## Option 2: Manual EC2 Setup

### 1. Launch EC2 Instance

```bash
# Launch instance (Amazon Linux 2023, t3.micro)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --key-name your-key-pair-name \
  --security-group-ids sg-xxxxxxxx \
  --subnet-id subnet-xxxxxxxx \
  --user-data file://deployment/aws/setup.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=myhome-prod}]'
```

### 2. Connect to Instance

```bash
ssh -i your-key.pem ec2-user@<public-ip>
```

### 3. Run Setup Script

```bash
# On the EC2 instance
chmod +x /opt/myhome/deployment/aws/setup.sh
sudo /opt/myhome/deployment/aws/setup.sh
```

## SSL Certificate (ACM)

```bash
# Request a certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names www.yourdomain.com \
  --validation-method DNS \
  --region us-east-1
```

Follow the DNS validation steps in the AWS Console.

## S3 for File Uploads

```bash
# Create an S3 bucket
aws s3 mb s3://myhome-uploads --region us-east-1

# Set bucket policy for private access
aws s3api put-public-access-block \
  --bucket myhome-uploads \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Create IAM user for the application
aws iam create-user --user-name myhome-app
aws iam attach-user-policy \
  --user-name myhome-app \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam create-access-key --user-name myhome-app
```

## CloudFront CDN (Frontend)

```bash
# Create CloudFront distribution for frontend
aws cloudfront create-distribution \
  --origin-domain-name your-alb-dns-name.us-east-1.elb.amazonaws.com \
  --default-root-object index.html
```

## Security Groups

The CloudFormation template creates the necessary security groups. For manual setup:

```bash
# Create ALB security group
aws ec2 create-security-group \
  --group-name myhome-alb-sg \
  --description "MyHome ALB Security Group"

# Allow HTTP and HTTPS
aws ec2 authorize-security-group-ingress --group-name myhome-alb-sg --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name myhome-alb-sg --protocol tcp --port 443 --cidr 0.0.0.0/0

# Create EC2 security group
aws ec2 create-security-group \
  --group-name myhome-ec2-sg \
  --description "MyHome EC2 Security Group"

# Allow SSH and application ports from ALB only
aws ec2 authorize-security-group-ingress --group-name myhome-ec2-sg --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name myhome-ec2-sg --protocol tcp --port 5000 --source-group myhome-alb-sg
```

## Monitoring with CloudWatch

```bash
# Create a CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name MyHome \
  --dashboard-body '{
    "widgets": [
      {
        "type": "metric",
        "properties": {
          "metrics": [["AWS/EC2", "CPUUtilization", "InstanceId", "<instance-id>"]],
          "title": "CPU Utilization",
          "period": 300
        }
      }
    ]
  }'

# Create CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name myhome-high-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:123456789:myhome-alerts
```

## Costs Estimate

| Resource | Type | Estimated Monthly Cost |
|----------|------|----------------------|
| EC2 | t3.micro | ~$8 |
| ALB | Application | ~$16 |
| S3 | 10 GB + requests | ~$1 |
| CloudFront | 10 GB transfer | ~$1 |
| **Total** | | **~$26/month** |

*Prices are approximate and vary by region.*
