<script>

</script>

<div class="controller">
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

<style>
  .controller {
    position: relative;
    background: #d2d2d0;
    width: 100%;
    height: 20rem;
    border-radius: 0 0 .25rem .25rem;
  }

  .row {
    position: relative;
    display: flex;
    height: 100%;
  }

  .row:after {
    content: "";
    display: table;
    clear: both;
  }

  .col {
    float: left;
    width: 33.33%;
    display: inline-flex;
  }

  .pad-area {
    position: absolute;
    background: #2b3334;
    left: 1rem;
    bottom: 1rem;
    width: 95%;
    height: 16rem;
    border-radius: .25rem;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
  }

  .dpad-wrapper {
    position: relative;
    display: table-cell;
    vertical-align: middle;
    margin: 0 auto;
    width: 9rem;
    height: 9rem;
    top: 3.5rem;
    left: 2rem;
  }

  .cross {
    position: absolute;
    background: #111113;
    border-radius: .2rem;
    z-index: 5;
  }

  .cross.vert {
    left: 3rem;
    width: 3rem;
    height: 9rem;
  }

  .cross.hor {
    top: 3rem;
    width: 9rem;
    height: 3rem;
  }

  .cross-border {
    position: absolute;
    background: #d3d2ce;
    border-radius: .2rem;
    z-index: 5;
  }

  .cross-border.vert {
    top: -.25rem;
    left: 2.75rem;
    width: 3.5rem;
    height: 9.5rem;
  }

  .cross-border.hor {
    top: 2.75rem;
    left: -.25rem;
    width: 9.5rem;
    height: 3.5rem;
  }

  .arrow {
    width: 0;
    height: 0;
    border-top: .875rem solid transparent;
    border-bottom: .875rem solid transparent;
    border-left: .875rem solid #2E2D2C;
    position: absolute;
    z-index: 9999;
    right: .6875rem;
    top: calc(50% - .5rem / 2 - .6875rem);
  }

  .arrow:after {
    content: "";
    position: absolute;
    width: .875rem;
    height: .875rem;
    background-color: #2E2D2C;
    right: .6rem;
    top: calc(50% - .4375rem);
  }

  .arrow.arrow-left {
    -moz-transform: rotate(180deg);
    -webkit-transform: rotate(180deg);
    -o-transform: rotate(180deg);
    -ms-transform: rotate(180deg);
    transform: rotate(180deg);
    top: calc(50% - .5rem / 2 - .6875rem);
    left: .6875rem;
    right: inherit;
  }

  .arrow.arrow-top {
    -moz-transform: rotate(-90deg);
    -webkit-transform: rotate(-90deg);
    -o-transform: rotate(-90deg);
    -ms-transform: rotate(-90deg);
    transform: rotate(-90deg);
    top: .275rem !important;
    left: calc(50% - 1rem / 2 + .06rem);
  }

  .arrow.arrow-bottom {
    -moz-transform: rotate(90deg);
    -webkit-transform: rotate(90deg);
    -o-transform: rotate(90deg);
    -ms-transform: rotate(90deg);
    transform: rotate(90deg);
    top: inherit;
    bottom: .275rem;
    left: calc(50% - 1rem / 2 + .06rem);
    top: inherit;
  }

  .circle {
    width: 1.5rem;
    height: 1.5rem;
    -webkit-border-radius: 50%;
    border-radius: 50%;
    background-color: #2E2D2C;
    position: relative;
    z-index: 99999;
    top: 42%;
    left: 42%;
  }

  .direction {
    position: absolute;
    background: #111113;
    border: none;
    width: 3rem;
    height: 3rem;
    z-index: 10;
  }

  .direction:active{
    background: #202021;
  }

  #Up {
    left: 3rem;
  }

  #Down {
    left: 3rem;
    bottom: 0;
  }

  #Left {
    top: 3rem;
  }

  #Right {
    top: 3rem;
    right: 0;
  }

  .center {
    width: 20rem;
    height: 100%;
    margin: 0 auto;
  }

  .gray-bar {
    position: relative;
    background: #9a9b96;
    width: 100%;
    height: 16%;
    border-radius: .25rem;
    margin-bottom: .72rem;
  }

  .gray-bar.first {
    height: 2.5rem;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  .gray-bar.big {
    background: #d3d2ce;
    height: 4rem;
    border: 5px solid #BDBDBD;
  }

  .gray-bar.last {
    height: 1.5rem;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .label {
    font-size: 1.25rem;
    text-align: center;
    line-height: 2.5rem;
  }

  .label.left-label {
    width: 50%;
    float: left;
  }

  .label.right-label {
    width: 50%;
    float: right;
  }

  .label::after {
    display:block;
    content:"";
    clear:both;
  }

  .skinny-button {
    position: absolute;
    background: #2E2D2C;
    top: 50%;
    transform: translateY(-50%);
    width: 6rem;
    height: 1.75rem;
    border-radius: 2rem;
  }

  .skinny-button,
  .skinny-button:hover,
  .skinny-button:active,
  .skinny-button:focus {
    border: 2.5px #000000 solid;
  }

  .skinny-button:active {
    background: #101211;
  }

  .skinny-button.select {
    left: 1.75rem;
  }

  .skinny-button.start {
    right: 1.75rem;
  }

  .logo-button-wrapper {
    position: relative;
    display: table-cell;
    vertical-align: middle;
    margin: 0 auto;
    height: 16rem;
    top: 0;
    left: -2rem;
  }

  .logo {
    font-size: 1.5rem;
    color: #9EBACC;
    margin-top: 2.75rem;
    margin-bottom: 4rem;
  }

  .logo span {
    color: #ffffff;
  }

  .button-pad {
    position: relative;
    float: right;
    background: #d3d2ce;
    margin-right: 1rem;
    width: 5rem;
    height: 5rem;
    border-radius: .25rem;
  }

  .button {
    background: #ef070d;
    width: 4rem;
    height: 4rem;
    margin: .5rem;
    border-radius: 50%;
  }

  .button,
  .button:hover,
  .button:focus,
  .button:active {
    border: 2px black solid;
  }

  .button:active{
    background: #b3070b;
  }

  .button-letter {
    position: absolute;
    font-size: 1.25rem;
    right: 0;
    bottom: -1.75rem;
  }
</style>