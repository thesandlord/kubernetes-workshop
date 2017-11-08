# Kubernetes Workshop

This workshop will walk you through deploying a Node.js microservices stack with Kubernetes.

## Optional: Set up local environment

This tutorial launches a Kubernetes cluster on [Google Container Engine](https://cloud.google.com/container)

If you are running this tutorial at home, you will need a Google Cloud Platform account. If you don't have one, sign up for the [free trial](https://cloud.google.com/free).

To complete this tutorial, you will need the following tools installed:

 - [Kubernetes CLI](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG.md#client-binaries)
 - [gcloud SDK](https://cloud.google.com/sdk)

You can also use [Google Cloud Shell](https://cloud.google.com/shell), a free VM that has all these tools pre-installed.

**For this workshop, I will assume you are using Cloud Shell.**

## Step 1: Create Cluster and Deploy Hello World

1. Create a cluster:

One great feature of Cloud Shell is that you get a machine assigned from the geographically closest pool.
We can use that to create our Kubernetes cluster in the same zone by reading the Cloud Shell instance zone
from the Google Compute Engine Metadata:
```
ZONE=$(curl "http://metadata.google.internal/computeMetadata/v1/instance/zone" \ 
      -H "Metadata-Flavor: Google" | sed 's:.*/::')
```

`gcloud container clusters create playground --nodes 3 --zone=$ZONE`

If you get an error, make sure you enable the Container Engine API [here](https://console.cloud.google.com/apis/api/container.googleapis.com/overview).

*Tip:* To enable kubectl autocomplete run `source <(kubectl completion bash)`

2. Run the hello world [deployment](./01-hello-node/deployment.yaml):

`kubectl apply -f ./01-hello-node/deployment.yaml`

Expose the container with a [service](./01-hello-node/service.yaml):

`kubectl apply -f ./01-hello-node/service.yaml`

At this stage, you have created a Deployment with one Pod, and a Service with an external load balancer that will send traffic to that pod.

You can see the external IP address for the service with the following command. It might take a few minutes to get the external IP address:

`kubectl get svc`

*Tip:* You can use watch to monitor the status of your services: `watch -n1 kubectl get svc`

Once you see the external ip address you can navigate to the Hello World app in your browser.

## Step 2: Scale the Hello World App

You can easily scale out and in your applications. 
One pod of our app is not enough. Let's get 5 of them!

`kubectl scale deployment hello-node-green --replicas=5`

You can see the all pods with the following command:

`kubectl get pods`

## Step 3: Hello World is boring, let's update the app

The new app allows you to upload a picture, flips it around, and displays it.

You can see the source code [here](./imageflipper-app/index.js).

Lets package the new app into a container so we can run it on Kubernetes.

The specification to build our container image can be found in the [Dockerfile](./imageflipper-app/Dockerfile).

There are 2 options to build our container, locally or with the [Google Container Builder](https://cloud.google.com/container-builder). Chose one of the two.

### Option 1 - Locally

To make the build a bit easier we use a [Makefile][./imageflipper-app/Makefile]. It will build the container image, tag it with the current version (obtained with `git describe --always`) and optionally push it to the [Google Container Registry](https://gcr.io).

To build the container run:

`cd imageflipper-app && make container && cd ..`

To push the container image to the Container registry run:

`cd imageflipper-app && make push-gcr && cd ..`

### Option 2 - Google Container Builder

[Google Container Builder](https://cloud.google.com/container-builder) will build your containers for you remotely on GCP. To submit a build run the following command:

``VERSION=`git describe --always`; gcloud container builds submit --tag gcr.io/$DEVSHELL_PROJECT_ID/imageflipper-app:$VERSION ./imageflipper-app/``

This will automatically build and push the Docker image to your projects [Google Container Registry](https://gcr.io).

Now, we are going to update the deployment created in [Step 1](#step-1:-create-cluster-and-deploy-hello-world). You can see the new YAML file [here](/02-rolling-update/deployment.yaml.template).

Make a copy of the template file [deployment.yaml.template](./02-rolling-update/deployment.yaml.template) and save it in the same folder as `deployment.yaml`. Replace the <PROJECT_ID> and <VERSION> placeholders with your Project ID and the current git version(`git describe --always`).
You can use the following command to do all this in one step:

``VERSION=`git describe --always`; sed -e "s~<PROJECT_ID>~$DEVSHELL_PROJECT_ID~g" -e "s~<VERSION>~$VERSION~g" ./02-rolling-update/deployment.yaml.template > ./02-rolling-update/deployment.yaml``

Now use the apply command to update the deployment. The only change to this file from the first deployment.yaml is the new container image.

`kubectl apply -f ./02-rolling-update/deployment.yaml`

This will replace all the old containers with the new ones. Kubernetes will perform a rolling update; it will delete one old container at a time and replace it with a new one.

You can watch the containers being updated with this command:

`watch -n1 kubectl get pods`

Once it is done, press `ctrl + c` to quit.

If you refresh the page pointing to the external ip of your service now, you'll see the updated website!

## Step 4: Splitting the app into Microservices

The imageflipper app is created and running, but what if you want to innovate on the image flipping independent of the frontend? We need to separate these two parts. Lets create a backend service that does the image manipulation and will expose a REST API that the frontend app can communicate with.

You can see the source code for the backend service [here](./imageflipper-service/index.js).

You again have the 2 options from [Step 3](#step-3:-hello-world-is-boring,-let's-update-the-app) to build your container.

`cd imageflipper-service && make push-gcr && cd ..`

Run the backend [deployment](./imageflipper-service/deployment.yaml):

``VERSION=`git describe --always`; sed -e "s~<PROJECT_ID>~$DEVSHELL_PROJECT_ID~g" -e "s~<VERSION>~$VERSION~g" ./imageflipper-service/deployment.yaml.template > ./imageflipper-service/deployment.yaml``

`kubectl apply -f ./imageflipper-service/deployment.yaml`

The service.yaml file for the backend service is very similar to the frontend service, but it does not specify `type: LoadBalancer`. This will make the service a cluster local service instead that is only accessible from inside the cluster.

Make the backend pods discoverable and addressable with a [service](./imageflipper-service/service.yaml):

`kubectl apply -f ./imageflipper-service/service.yaml`

## Step 5: Update Frontend Service to use the Backend with a Blue-Green deployment

Now that the backend service is running, we need to update the frontend to use the new backend.

Make the changes in [imageflipper-app/index.js](./imageflipper-app/index.js) and update the `/api/photo` endpoint to use the new backend. Don't cheat, but if you need "inspiration" you can find the solution [here](./imageflipper-app/index.js.v2).

To create a new git version we need to commit our changes. Run the following command to commit the changes and tag the new version.

First we need to set git user email and name:
```
git config --global user.email "devstarXXXX@gcplab.me"
git config --global user.name "Rockstar Developer"
```

`git add -u && git commit -m "new awesome backend" && git tag -a v2.0 -m "Version 2.0"`

Now we can build our new frontend container image:

`cd imageflipper-app && make push-gcr && cd ..`

Instead of doing a rolling update like we did before, we are going to use a Blue-Green strategy this time.

This means we will spin up a new deployment of the frontend, wait until all containers are created, then configure the service to send traffic to the new deployment, and finally spin down the old deployment. This allows us to make sure that users don't get different versions of the app, smoke test the new deployment at scale, and a few other benefits. You can read more about [Blue-Green Deployments vs Rolling Updates here](http://stackoverflow.com/questions/23746038/canary-release-strategy-vs-blue-green).

Spin up the the new deployment with the following command:

``VERSION=`git describe --always`; sed -e "s~<PROJECT_ID>~$DEVSHELL_PROJECT_ID~g" -e "s~<VERSION>~$VERSION~g" ./03-blue-green/deployment.yaml.template > ./03-blue-green/deployment.yaml``

`kubectl apply -f ./03-blue-green/deployment.yaml`

Check if the new version is running with the following command:

`kubectl get pods`

To test the service we need to make the new version accessible through a Kubernetes service.

Create the `hello-node-test` service with the following command:

`kubectl apply -f ./03-blue-green/service.yaml`

Wait for the external ip to be assigned:

`watch -n1 kubectl get svc`

Once the external ip is assigned for the `hello-node-test` service direct your browser in a new tab to it. Verify if everything works. Once you're happy, we can switch over the existing (production) `hello-node` service to the new frontend.

To do this, we use the `kubectl edit` command:

`kubectl edit svc hello-node`

Look for the selector and change it to `hello-node-green`:

Before:

```
...
  selector:
    name: hello-node-green
...
```

After:

```
...
  selector:
    name: hello-node-blue
...
```


At this point, you can go back to the original browser tab were you had the first version open and verify the new code will be live. Once you are happy with the results, you can turn down the green deployment.

`kubectl scale deployment hello-node-green --replicas=0`

or

`kubectl delete deployment hello-node-green`
