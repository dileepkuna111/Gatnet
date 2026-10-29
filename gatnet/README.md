# Gatnet — ISP website + DevOps deployment lab

Gatnet is a **fictional portfolio/demo ISP** serving Washington, Idaho, Montana, and Oregon. It includes internet plan cards, Wi-Fi 7 router, TV and home-phone add-ons, a demo ZIP-code form, and a demo plan-interest form. It does not verify real service coverage, take orders, or save submitted personal information.

## Project contents

- `app/` — Node.js + Express website, responsive HTML/CSS/JavaScript, `/health`, and `/api/plans`.
- `terraform/` — AWS infrastructure: public Application Load Balancer, Auto Scaling Group (2–3 Amazon Linux 2023 EC2 instances), private-to-ALB app security group, S3 artifact bucket, instance role, and health checks.
- `app/Dockerfile` — container build.
- `jenkins/Jenkinsfile` — learning pipeline skeleton for checkout, test, container build, and extension points.
- `ansible/` — optional host preparation playbook.
- `kubernetes/` — example Deployment, Service, and ALB Ingress manifests.
- `sonar-project.properties` — SonarQube project configuration.

## Run locally

Prerequisites: Node.js 20+ and npm.

```bash
cd app
npm install
npm start
```

Open `http://localhost:3000`. Check `http://localhost:3000/health` and `http://localhost:3000/api/plans`.

## Deploy to AWS with Terraform + ALB + Auto Scaling

This is the simplest repeatable AWS path included in this lab. Terraform creates the AWS resources and uses EC2 user data to install Node.js, download the app ZIP from a private S3 bucket, and run it under systemd. The Application Load Balancer routes HTTP traffic to healthy EC2 instances. The instances are managed by an Auto Scaling Group.

### Before you start

1. An AWS account with permission to create EC2, VPC security groups, IAM roles/policies/instance profiles, S3, ELBv2, and Auto Scaling resources.
2. AWS CLI v2, Terraform 1.6+, and Git installed on your workstation.
3. AWS credentials configured using an IAM user/role or AWS SSO. Do not put access keys in source files.
4. A **default VPC with at least two subnets in different Availability Zones** in the chosen region. The included Terraform reads the default VPC/subnets. If your account has no default VPC, adapt `terraform/main.tf` to use an explicit VPC and public subnets.
5. Expect AWS charges while resources exist. Use `terraform destroy` when finished.

### Step 1 — Install tools

On a Linux workstation (not the EC2 app server), install or verify AWS CLI and Terraform using their official installation guides. Then verify:

```bash
aws --version
terraform version
git --version
aws sts get-caller-identity
```

If `aws sts get-caller-identity` fails, configure credentials before continuing:

```bash
aws configure
```

Use a dedicated least-privilege IAM identity in real environments; avoid long-lived root credentials.

### Step 2 — Choose a region and inspect subnets

```bash
aws configure set region us-west-2
aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[].VpcId' --output table
aws ec2 describe-subnets --filters Name=default-for-az,Values=true --query 'Subnets[].{Subnet:SubnetId,AZ:AvailabilityZone,PublicIP:MapPublicIpOnLaunch}' --output table
```

If the default VPC or multiple subnets do not exist, create/choose a VPC with at least two public subnets and adjust the Terraform data sources.

### Step 3 — Initialize and review Terraform

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform fmt -recursive
terraform validate
terraform plan -out=tfplan
```

Review the plan. It creates billable resources, including an ALB and two EC2 instances. Do not apply a plan you do not understand.

### Step 4 — Create infrastructure

```bash
terraform apply tfplan
```

Type `yes` if prompted. Terraform uploads a ZIP of the `app/` directory to a private S3 bucket, then creates the ALB, target group, launch template, instance profile, and Auto Scaling Group. EC2 user data installs Node.js 20, downloads the artifact, and starts the systemd service.

### Step 5 — Get the website URL

```bash
terraform output
terraform output -raw website_url
```

Open the printed `http://...elb.amazonaws.com` URL in a browser. Initial bootstrapping may take 3–8 minutes.

Check the target health:

```bash
aws elbv2 describe-target-health \
  --target-group-arn "$(terraform output -raw target_group_arn 2>/dev/null || true)"
```

If the output says `target_group_arn` is not defined, use the AWS console: EC2 → Target Groups → Gatnet target group → Targets. (The demo outputs the website URL, DNS name, ASG name, and artifact bucket; target-group ARN can also be obtained with `terraform state show aws_lb_target_group.app`.)

### Step 6 — Troubleshoot an unhealthy target

In AWS Console, open EC2 → Instances, select an instance, and inspect **Actions → Monitor and troubleshoot → Get system log**. If you enabled and configured Systems Manager, use Session Manager and run:

```bash
sudo systemctl status gatnet --no-pager
sudo journalctl -u gatnet -n 100 --no-pager
sudo curl -i http://127.0.0.1:3000/health
sudo ss -lntp | grep 3000
sudo tail -n 100 /var/log/cloud-init-output.log
```

Common causes:
- User data is still running; wait a few minutes.
- The region has no default VPC or lacks two usable subnets.
- The instance role cannot read the S3 artifact.
- Package downloads cannot reach the internet.
- Target group health-check path must be `/health` and port 3000.
- The instance security group intentionally allows port 3000 only from the ALB security group. Do not open port 3000 to the world.

### Step 7 — Update the app

Change files under `app/`, then rerun from the `terraform/` directory:

```bash
terraform plan -out=tfplan
terraform apply tfplan
```

Terraform updates the S3 artifact, but changing an object alone does not automatically reboot existing instances. For this learning version, force a new launch-template version by changing its user-data inputs or replace instances through an ASG instance refresh. A robust production pipeline should publish versioned immutable artifacts/images and perform a controlled rolling deployment; do not rely on manually editing running servers.

### Step 8 — Clean up to stop ongoing charges

From the `terraform/` directory:

```bash
terraform destroy
```

Review the deletion plan and type `yes`. The S3 bucket is configured for Terraform-managed cleanup; do not store anything important in it.

## DevOps learning path

Suggested sequence:

1. **Linux:** processes, permissions, systemd, logs, networking, disk space.
2. **Git:** commit the project and push it to a private repository.
3. **Jenkins:** install/use a Jenkins agent with Node.js, npm, Docker, and AWS credentials stored in Jenkins Credentials.
4. **SonarQube:** configure a server/token credential in Jenkins and run the scanner; keep tokens out of source control.
5. **Nexus Repository:** create a Docker or npm hosted repository and publish versioned artifacts/images using a service account.
6. **Terraform:** provision infrastructure with remote state, locking, reviewable plans, and separate environments.
7. **Ansible:** configure standalone hosts where appropriate; this Terraform demo uses cloud-init/user data instead.
8. **Docker/Kubernetes:** build the image and deploy the example manifests to a Kubernetes cluster. Replace `YOUR_DOCKER_REGISTRY/gatnet:1.0.0` with the actual pushed image and configure an Ingress controller before applying `ingress-example.yaml`.

### Docker local check

```bash
cd app
docker build -t gatnet:1.0.0 .
docker run --rm -p 3000:3000 gatnet:1.0.0
```

Open `http://localhost:3000`.

### Kubernetes example

After building and pushing an image to a registry your cluster can pull from:

```bash
kubectl apply -f kubernetes/deployment.yaml
kubectl rollout status deployment/gatnet
kubectl get pods,service
```

The example Service is internal (`ClusterIP`). To expose it, configure an ingress controller and apply the sample ingress manifest after reviewing its AWS Load Balancer Controller prerequisites.

## Security and production caveats

- The ALB is public HTTP-only in this starter. For production, configure HTTPS with an ACM certificate, a DNS name, redirects from HTTP to HTTPS, WAF as appropriate, and secure headers/CSP.
- Demo forms are client-side only and intentionally do not collect or persist information.
- Pricing and coverage are fictitious examples. Do not represent this as a real ISP or make real customer promises.
- Terraform state contains infrastructure metadata. Use encrypted remote state with locking for team environments; do not commit state files or credentials.
- The included Jenkinsfile is a teaching skeleton, not a turnkey production CI/CD pipeline. Configure repository credentials, SonarQube, Nexus, a container registry, deployment approvals, and secrets management before use.
