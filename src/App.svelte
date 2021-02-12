<script>
</script>

<div class="wrapper">
  <div class="video">
    <iframe
      src="https://player.twitch.tv/?video=910355935&parent=localhost&parent=rob-showcase.vercel.app"
      frameborder="0"
      allowfullscreen="true"
      scrolling="no"
      height="500"
      width="100%">
    </iframe>
  </div>

  <div class="controller">
    <!-- <div class="cable"></div> -->
    <div class="pad-area">

      <div class="row">
          <div class="col">
            <div class="dpad-wrapper">
              <div class='cross-border vert'></div>
              <div class='cross-border hor'></div>

              <div class="cross vert"></div>
              <div class="cross hor"></div>

              <button id="Up" class="direction">
                <div class="arrow arrow-top"></div>
              </button>
              <button id="Down" class="direction">
                <div class="arrow arrow-bottom"></div>
              </button>
              <button id="Left" class="direction">
                <div class="arrow arrow-left"></div>
              </button>
              <button id="Right" class="direction">
                <div class="arrow arrow-right"></div>
              </button>

              <div class="circle"></div>

            </div>
          </div>

          <div class="col">
            <div class="center">
              <div class="gray-bar first"></div>
              <div class="gray-bar"></div>
              <div class="gray-bar">
                <div class="label left-label">INFO</div>
                <div class="label right-label">START</div>
              </div>
              <div class="gray-bar big">
                <button id="Select" class="skinny-button select"></button>
                <button id="Start" class="skinny-button start"></button>
              </div>
              <div class="gray-bar last"></div>
            </div>
          </div>

          <div class="col">
            <div class="logo-button-wrapper">
              <div class="logo">
                blues<span>wireless</span>
              </div>

              <div class="buttons">
                <div class="button-pad">
                  <button id="A" class="button"></button>
                  <div class="button-letter">A</div>
                </div>

                <div class="button-pad">
                  <button id="B" class="button"></button>
                  <div class="button-letter">B</div>
                </div>
              </div>
            </div>
          </div>
      </div>

    </div>
  </div>

</div>

<style>
</style>