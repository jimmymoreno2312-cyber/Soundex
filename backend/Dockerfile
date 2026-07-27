#dockerfile

#Python version
FROM python:3.12-slim

#working directory
WORKDIR /app

#copy requirements file into working directory
COPY requirements.txt .

#installs stuff in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

#copy stuff in backend folder (.env.example, app.py, etc.) into container
COPY . .

#port 5001
EXPOSE 5001

#runs app.py
CMD ["python", "app.py"]




