# Converting Really Slick Screensavers cyclone C & OpenGL code to three.js with LLMs

I gave 4 LLMs this same prompt and asked them to convert a screen saver into three.js. The goal here is to attempt to convert Terence Welsh's excellent Really Slick Screensaver cyclone code, origninally written in OpenGL and C and see how close we can get with each model. This is a complex screensaver with a lot going on so I thought it would be interesting to see what was returned. I had to fix very minor issues and the code is virutally untouched from what the LLMs provided.

The prompt includes the original, unmodified cyclone code and supplies a simple three.js scene as an example. In testing this, I noticed the models ran into problems with lighting and materials so the prompt asks to keep the rendering simple. You'll find the prompt, original source code, an all outputs in this repo.

Claude 3.5 Sonnet and OpenAI's o1 preview both made torando-looking things. 4o made a stream of particles and GPT-4 produced a squiggly line.

See the results here: https://zackthedoer.github.io/really-slick-cyclone-experiments/  
