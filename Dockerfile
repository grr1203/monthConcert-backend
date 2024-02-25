FROM public.ecr.aws/lambda/python:3.12 as build

RUN dnf install -y unzip && \
    curl -Lo "/tmp/chromedriver-linux64.zip" "https://storage.googleapis.com/chrome-for-testing-public/122.0.6261.57/linux64/chromedriver-linux64.zip" && \
    curl -Lo "/tmp/chrome-linux64.zip" "https://storage.googleapis.com/chrome-for-testing-public/122.0.6261.57/linux64/chrome-linux64.zip" && \
    unzip /tmp/chromedriver-linux64.zip -d /opt/ && \
    unzip /tmp/chrome-linux64.zip -d /opt/


FROM public.ecr.aws/lambda/python:3.12 

RUN dnf install -y atk cups-libs gtk3 libXcomposite alsa-lib \
    libXcursor libXdamage libXext libXi libXrandr libXScrnSaver \
    libXtst pango at-spi2-atk libXt xorg-x11-server-Xvfb \
    xorg-x11-xauth dbus-glib dbus-glib-devel nss mesa-libgbm

COPY ./requirements.txt ./

RUN pip install -r requirements.txt
# RUN pip install selenium==4.18.1 beautifulsoup4 openai

COPY --from=build /opt/chrome-linux64 /opt/chrome
COPY --from=build /opt/chromedriver-linux64 /opt/
# # Define function directory
# ARG FUNCTION_DIR="/function"

RUN chmod +x /opt/chrome/chrome
RUN chmod +x /opt/chromedriver

# # Create function directory
# RUN mkdir -p ${FUNCTION_DIR}


# Copy your Python code into the container
COPY ./crawling ./

# # Set working directory to function root directory
# WORKDIR ${FUNCTION_DIR}

# RUN cat /opt/chrome/chrome | head -n 1

CMD [ "main.handler" ]