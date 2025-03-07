FROM node:23-alpine

# Installer nodemon globalement
RUN npm install -g nodemon

# Définir le répertoire de travail
WORKDIR /app

COPY package*.json /app/

RUN npm install

# Copier le code source dans le conteneur
COPY ./src /app

# Exposer le port sur lequel l'application va tourner
EXPOSE 3000

# Commande pour lancer l'application avec nodemon
CMD ["nodemon", "index.js"]
