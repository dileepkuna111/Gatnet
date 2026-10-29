variable "aws_region" {
  description = "AWS region to deploy the demo into."
  type        = string
  default     = "us-west-2"
}
variable "project_name" {
  type    = string
  default = "gatnet"
}
variable "instance_type" {
  type    = string
  default = "t3.micro"
}
variable "desired_capacity" {
  type    = number
  default = 2
}
variable "min_size" {
  type    = number
  default = 2
}
variable "max_size" {
  type    = number
  default = 3
}
