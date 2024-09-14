# Use an official Node.js runtime as a parent image
FROM node:20.5.0

# Set the working directory in the container
WORKDIR /app

# Install any needed packages specified in package.json
COPY package*.json ./
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Start the React app in development mode
CMD ["npm", "start"]