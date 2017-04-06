# Kubernetes Workshop

This workshop will walk you through deploying a Node.js microservices stack with Kubernetes.

## Optional: Set up local environment

This tutorial launches a Kubernetes cluster on [Google Container Engine](https://cloud.google.com/container-engine)

If you are running this tutorial at home, you will need a Google Cloud Platform account. If you don't have one  

To complete this tutorial, you will need to following tools installed:

- [Docker](docker.com)
- [Kubernetes CLI]()
- [gcloud SDK]()

You can also use [Google Cloud Shell](https://cloud.google.com/shell), a free VM that has all these tools pre-installed. For this workshop, I will assume you are using Cloud Shell.

## Step 1: Create Cluster and Deploy Hello World

I am lazy, follow the instructions [here](https://cloud.google.com/container-engine/docs/quickstart).

**Do not clean up the deployment or delete the cluster.**

At this stage, you have created a Deployment with one Pod, and a Service with an extrnal load balancer that will send traffic to that pod.

You can see the extrnal IP address for the service with this command:

`kubectl get svc`

## Step 2: Scale up deployment

One pod is not enough. Let's get 10 of them!

`kubectl scale deployment hello-node --replicas=10`

You can see the all pods with this command:

`kubectl get pods`

## Step 3: Hello world is boring, let's update the app

The new app will take a picture, flip it around, and return it.

You can see the source code [here](./rolling-update/index.js).

The Dockerfile for this container can be found [here](./rolling-update/Dockerfile).

Build the Docker Container:

`docker build -t imageflipper:1.0 ./rolling-update/`

Now push this image to [Google Container Registry](https://gcr.io) so we can securly access it from the cluster.

Tag:
`docker tag imageflipper:1.0 gcr.io/$DEVSHELL_PROJECT_ID/imageflipper:1.0`

Push:
`gcloud docker -- push gcr.io/$DEVSHELL_PROJECT_ID/imageflipper:1.0`

Now, we are going to update the deployment created in the first step. You can see the YAML file [here](./rolling-update/deployment.yaml).

Replace the `<PROJECT_ID>` placeholder with your Project ID. You can see your project ID by running `echo $DEVSHELL_PROJECT_ID`
** come up with bash one lines **

Now use the apply command to update the deployment.

`kubectl apply -f ./rolling-update/deployment.yaml`

This will replace all the old containers with the new ones. Kubernetes will perform a rolling update; it will delete one old container at a time and replace it with a new one.

If you visit the website now, you can see the updated website!