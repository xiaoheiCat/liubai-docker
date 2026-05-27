FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY liubai-backends/liubai-ffmpeg/package.json liubai-backends/liubai-ffmpeg/nodeman.json ./
COPY liubai-backends/liubai-ffmpeg/app.js ./

RUN npm install

RUN mkdir -p static/amr static/mp3

EXPOSE 3000

CMD ["node", "app.js"]
