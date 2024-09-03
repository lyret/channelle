<p style="text-align: center;"><img src="https://i.ibb.co/p0vNs4r/channelle-logo-sept-2024-long.png" alt="channelle-logo-sept-2024-long" border="0"></p>

# Skärmteaterns Channelle

Channelle consists of two individual parts - The **Scene** is a server/client webapplication responsible for a single performance or lecture, i.e. a single online meeting in a conference tool. The **Theater House** is a planing and scheduling webapplication primary meant to create and launch scenes.

## Scene Server / Client

_**Found in this repo**_ - Details to be added

## Theater House Server / Client

*yet to be implemented*


## Planing and contributions

Right now we are working towards version 1.0 - want to contribute? Get in touch! 

## History

Skärmteatern is the creation of two swedish performence artists that, during the COVID pandemic started performing live theater online using Zoom meetings. To great success they were later granted a culture grant by the Swedish state to help continue this and develop an online application able to better serve as a theater scene and that would be free from the economic interessts of any huge international cooperation.

## Licence
<p style="height:14px!important;margin-left:3px;vertical-align:text-bottom;text-align:center;">
<img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1" alt=""><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1" alt=""><img src="https://mirrors.creativecommons.org/presskit/icons/nc.svg?ref=chooser-v1" alt=""></p>

<a property="dct:title" rel="cc:attributionURL" href="https://codeberg.org/lyret/channelle">Channelle</a> by <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="">Skärmteatern</a> & <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://maskinrepubliken.se/">Maskinrepubliken</a> is licensed under <a href="https://creativecommons.org/licenses/by-nc/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">CC BY-NC 4.0</a>




### 

- Lookup: 

 - Prisma ORM: https://www.prisma.io/orm
 - Bulma: https://bulma.io/
 - Ionicons: https://ionic.io/ionicons
 - https://sveltelegos.com/guides/
  
  Underlag	
  SFU Gränsvärden	https://dolby.io/blog/breaking-point-webrtc-sfu-load-testing/
  
      
  - Nice Lego:	
  * https://sveltelegos.com/guides/watchers/watch/	
  * https://sveltelegos.com/guides/middlewares/history/	
  * Utilities, för data från enheten	
  * Stores, för data från enheten, nätverk, mus, fönster mm	
  
  
  ### Media Soup
  
  - Few to many (one to many) broadcasting and group video conferencing
  - Real-time Transport (RTP) Media Streaming
  
  Krav:
  
  - Node.js version >= v16.0.0
  - Python version >= 3.7 with PIP
  

  ### Historia

  Förstudie.

 I Förstudien skrevs 

  

  # Svelte Legos
  
  Collection of essential Svelte Composition Utilities
  <br>
  <br>
  
  ## 🚀 Features
  
  - 🎪 [**Interactive docs & demos**](https://svelte-legos.surge.sh)
  - ⚡ **Fully tree shakeable**: Only take what you want, [bundle size]
  - 🦾 **Type Strong**: Written in [TypeScript](https://www.typescriptlang.org/), with [TS Docs](https://github.com/microsoft/tsdoc)
  - 🔋 **SSR Friendly**
  - 🌎 **No bundler required**: Usable via CDN
  - 🔩 **Flexible**: Configurable event filters and targets
  
  ## 🦄 Usage
  
  ```svelte
  <script lang="ts">
  import { counterStore } from "svelte-legos";
  
  const { counter, inc, dec, set, reset } = counterStore();
  </script>
  
  <button on:click={() => inc()}>Increment</button>
  
  {counter}
  
  <button on:click={() => dec()}>Decrement</button>
  ```
  
  ```svelte
  <script lang="ts">
  import { clickOutsideAction } from "svelte-legos";
  
  let hidden = false;
  
  function handleClickOutside() {
    hidden = !hidden;
  }
  </script>
  
  <div class="modal" use:clickOutsideAction on:clickoutside={handleClickOutside} />
  ```
  https://github.com/ankurrsinghal/svelte-legos
  https://svelte-legos.surge.sh/guides/
  
  Refer to [functions list](https://svelte-legos.surge.sh/guides) or [documentations](https://svelte-legos.surge.sh) for more details.
  
  ## 📦 Install
  
  ```bash
  npm i svelte-legos
  ```
  
  ## Local setup
  
  ```bash
  npm run start:dev
  ```
  
  ## 🌸 Thanks
  
  This project is heavily inspired by the following awesome projects.
  
  - [vueuse/vueuse](https://github.com/vueuse/vueuse)
  - [streamich/react-use](https://github.com/streamich/react-use)
  - [u3u/vue-hooks](https://github.com/u3u/vue-hooks)
  - [logaretm/vue-use-web](https://github.com/logaretm/vue-use-web)
  - [kripod/react-hooks](https://github.com/kripod/react-hooks)
  
  ## License
  
  [MIT](LICENSE.md)
  