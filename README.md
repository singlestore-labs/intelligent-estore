# SingleStore | GenAI eStore

**Attention**: The code in this repository is intended for experimental use only and is not fully tested, documented, or supported by SingleStore. Visit the [SingleStore Forums](https://www.singlestore.com/forum/) to ask questions about this repository.

## Requirements

- `Node.js` at least `v18.15.0`

## Getting started

1. Create a `.env` file based on the `.env.example` file
2. Install dependencies by running: `npm i`

## Insert the data into a database

1. Create a database
2. Run: `npm run start:data`

**Note:** Creating product image descriptors can cost up to $50 using OpenAI Vision API.

## Run the dev environment

1. Run `npm run build`
2. Run `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000)

## Build the prod environment

1. Run `npm run build`
2. Run `npm run start`
3. Open [http://localhost:3000](http://localhost:3000)
