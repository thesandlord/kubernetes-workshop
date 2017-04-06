# Kubernetes Workshop

This workshop will walk you through deploying a Node.js microservices stack with Kubernetes.

## Optional: Set up local environment

This tutorial launches a Kubernetes cluster on [Google Container Engine](https://cloud.google.com/container)

If you are running this tutorial at home, you will need a Google Cloud Platform account. If you don't have one, sign up for the [free trial](https://cloud.google.com/free).

To complete this tutorial, you will need to following tools installed:

 - [Kubernetes CLI](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG.md#client-binaries)
 - [gcloud SDK](https://cloud.google.com/sdk)

You can also use [Google Cloud Shell](https://cloud.google.com/shell), a free VM that has all these tools pre-installed.

**For this workshop, I will assume you are using Cloud Shell.**

## Step 1: Create Cluster and Deploy Hello World

1. Create a cluster:

`gcloud container clusters create my-cluster --zone=europe-west1-a`

If you get an error, make sure you enable the Container Engine API [here](https://console.cloud.google.com/apis/api/container.googleapis.com/overview).

2. Run the hello world [deployment](./hello-node/deployment.yaml):

`kubectl apply -f ./hello-node/deployment.yaml`

Expose the container with a [service](./hello-node/service.yaml):

`kubectl apply -f ./hello-node/service.yaml`

At this stage, you have created a Deployment with one Pod, and a Service with an extrnal load balancer that will send traffic to that pod.

You can see the extrnal IP address for the service with this command. It might take a few minutes to get the extrnal IP address:

`kubectl get svc`

## Step 2: Scale up deployment

One pod is not enough. Let's get 10 of them!

`kubectl scale deployment hello-node --replicas=10`

You can see the all pods with this command:

`kubectl get pods`

## Step 3: Hello world is boring, let's update the app

The new app will take a picture, flip it around, and return it.

You can see the source code [here](./rolling-update/index.js).

The Dockerfile for this container can be found here.

Build the Docker Container using [Google Container Builder](https://cloud.google.com/container-builder):

`gcloud container builds submit --tag gcr.io/$DEVSHELL_PROJECT_ID/imageflipper:1.0 ./rolling-update/`

This will automatically build and push this Docker image to [Google Container Registry](https://gcr.io).

Now, we are going to update the deployment created in the first step. You can see the new YAML file [here](/rolling-update/deployment.yaml).

Replace the <PROJECT_ID> placeholder with your Project ID. Use this command to do it automatically:

`sed -i "s~<PROJECT_ID>~$DEVSHELL_PROJECT_ID~g" ./rolling-update/deployment.yaml`

Now use the apply command to update the deployment. The only change to this file from the first deployment.yaml is the new container image.

`kubectl apply -f ./rolling-update/deployment.yaml`

This will replace all the old containers with the new ones. Kubernetes will perform a rolling update; it will delete one old container at a time and replace it with a new one.

You can watch the containers being updated with this command:

`watch kubectl get pods`

Once it is done, press `ctrl + c` to quit.

If you visit the website now, you can see the updated website!