<p style="text-align: center;"><img src="https://i.ibb.co/p0vNs4r/channelle-logo-sept-2024-long.png" alt="channelle-logo-sept-2024-long" border="0"></p>


# Skärmteaterns Channelle - scen / mötesrum

### [Planering](https://docs.google.com/spreadsheets/d/1VxNay7jHiwGuvopK9huBMex3ONTnylXZ8f2xlVaVSyI/edit#gid=2100598513)

- Lookup: https://github.com/daily-co/mediasoup-sandbox/blob/master/single-page/server.js

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
  