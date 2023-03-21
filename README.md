# Rum Chat

Chat room built with Rum

If you want to run it on your own computer, follow these steps:

## Get the code

```
git clone https://github.com/okdaodine/rum-chat.git
```

## Configure Rum Group

1. Open [Quorum open node](https://node.rumsystem.net/)
2. Log in with Github
3. Create a group
4. Open the group
5. Copy the seed
6. Fill in the `seedUrl` in `server/config.js`.

Done! let's start using this Rum Group.

## Start the frontend service
(This example is developed in JavaScript, so please install nodejs first)

In the root directory, run:

```
yarn install
yarn dev
```

## Start the backend service

Open another terminal window and execute:

```
cd server
yarn install
yarn dev
```

## Access the service

http://localhost:3000
