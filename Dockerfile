# Используем официальный образ Node.js в качестве базового образа
FROM node:14

# Устанавливаем директорию приложения внутри контейнера
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости приложения
RUN npm ci

# Копируем остальные файлы приложения
COPY . .

ENV PORT=3000

# Опционально: указываем порт, на котором работает ваше приложение
EXPOSE $PORT

# Запускаем команду для запуска приложения
CMD [ "npm", "start" ]
