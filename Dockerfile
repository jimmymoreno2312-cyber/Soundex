#frontend dockerfile

#base image
FROM node:22

#working directory
WORKDIR /app

#copy JSON files over
COPY package*.json ./

#Install frontend dependencies
RUN npm install

#copy frontend into container
COPY . .

#default vite port
EXPOSE 5173

#In package.json, run scripts
CMD ["npm", "run", "dev", "--", "--host"]
