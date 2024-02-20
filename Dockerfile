FROM public.ecr.aws/lambda/nodejs:20

COPY ./package.json  ${LAMBDA_TASK_ROOT}

RUN npm install

RUN node --version


COPY ./build ${LAMBDA_TASK_ROOT}

ENV OPENAI_API_KEY=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
ENV AWS_ACCESS_KEY_ID=AKIAYS2NSEWDMNIVSZ75
ENV AWS_SECRET_ACCESS_KEY=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
ENV STAGE=dev
# RUN echo $(ls ./lib)

CMD [ "artist/post.handler" ]