FROM amazon/aws-lambda-nodejs:16
# Install Chrome to get all of the dependencies installed
ADD https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm chrome.rpm
RUN yum install -y ./chrome.rpm

COPY ./package.json  ${LAMBDA_TASK_ROOT}

RUN npm install

RUN node --version


COPY ./build ${LAMBDA_TASK_ROOT}

ENV OPENAI_API_KEY=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
ENV AWS_ACCESS_KEY_ID=AKIAYS2NSEWDMNIVSZ75
ENV AWS_SECRET_ACCESS_KEY=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
ENV STAGE=dev 

RUN ls
# RUN echo $(ls ./lib)

CMD [ "artist/post.handler" ]