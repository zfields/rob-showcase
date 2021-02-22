<script>
  import { actions } from '../store.js';
  let last_command = "";

  actions.subscribe(updatedActions => {
    if (updatedActions.length > 0) {
      last_command = updatedActions[updatedActions.length-1];
    }
  });
</script>

<div class="video">
  <iframe
    src="https://player.twitch.tv/?channel=nesroblive&parent=localhost&parent=rob-showcase.vercel.app"
    title="Twitch Stream Embed"
    frameborder="0"
    allowfullscreen="true"
    scrolling="no"
    height="500"
    width="100%">
  </iframe>
</div>
<div class="result-wrapper">
  <div class="result">
    <p class="title">
      Last R.O.B. Command
    </p>
    <p class="command">{last_command}</p>
  </div>
</div>

<style>
  .video, iframe {
    margin: 0 auto;
    z-index: 9999;
    position: relative;
  }

  iframe {
    display: block;
    border-style: none;
  }

  .result-wrapper {
    background-color: #212529;
    padding: .4rem;
  }
  .result {
    position: relative;
    margin: 4px;
    color: #fff;
    background-color: #212529;
    border-color: #fff;
    padding: 1.5rem 2rem;
    border-style: solid;
    border-width: 3px;
    text-align: center;
    height: 4.5rem;
  }
  .result .title {
    color: #fff;
    background-color: #212529;
    display: table;
    padding: 0 .5rem;
    margin: -2.1rem auto 1rem;
    font-size: 1rem;
  }
  .result .command {
    color:#d9403b;
    margin: 1rem 0 0 0;
  }
</style>