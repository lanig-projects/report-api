# Usar una imagen oficial de Node.js
FROM node:18

# Establecer el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copiar solo los archivos de dependencias primero
COPY package*.json ./

# Instalar las dependencias antes de copiar el código
RUN npm install

# Luego copiar el resto del código
COPY . .

# Exponer el puerto en el que corre la aplicación
EXPOSE 4321

# Comando para iniciar la aplicación
CMD ["node", "index.js"]
