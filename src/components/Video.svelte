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

  <div class="result-wrapper">
    <div class="result">
      <p class="title">
        Commands
      </p>
      <!-- <p class="command">{last_command}</p> -->
      <div class="command-list">
        <ol>
          <li class="done">Left</li>
          <li class="done">Right</li>
          <li class="">Up</li>
          <li class="">Down</li>
          <li class="">Close</li>
        </ol>
      </div>
    </div>
  </div>

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

<style>
  .video, iframe {
    margin: 0 auto;
    z-index: 999;
    position: relative;
  }

  iframe {
    display: block;
    border-style: none;
  }

  .result-wrapper {
    font-size: 12px !important;
    font-family: "Press Start 2P";
    background-color: #212529;
    padding: .4rem;
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 9999;
  }

  .result {
    position: relative;
    margin: 4px;
    color: #fff;
    background-color: #212529;
    border-color: #fff;
    padding: 1.5rem 1.5rem .25rem 1.5rem;
    border-style: solid;
    border-width: 3px;
    text-align: center;
  }

  .result .title {
    font-size: .875rem;
    color: #fff;
    background-color: #212529;
    display: table;
    padding: 0 .5rem;
    margin: -2.1rem auto 1rem;
  }

  .command-list ol {
    font-size: .875rem;
    list-style: none;
    padding-left: 0;
    margin-bottom: 1rem;
  }
  
  .command-list ol li {
    color: #666666;
    text-align: left;
    margin-bottom: .75rem;
  }

  .command-list ol li.done {
    color: #3cfc30;
  }

  .command-list ol li:before {
  content: "✓ ";
  }

</style>