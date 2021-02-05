<script>
  import { Input } from 'sveltestrap';
  export let frequency;

  const handleRangeUpdate = (event) => {
    const el = event.target;
    const value = (el.value-el.min)/(el.max-el.min)*100;

    //el.style.background = 'linear-gradient(to right, #1b3b52 0%, #1b3b52 ' + value + '%, #fff ' + value + '%, white 100%)';
  };
</script>

<Input on:input={handleRangeUpdate} type="range" name="frequency" id="sampleFrequency"
  min="60" max="6000" bind:value={frequency} step="15" />
<output class="frequencyPopup"></output>

<style>
  :global(#sampleFrequency) {
    border: none;
    height: 1px;
    outline: none;
    transition: background 450ms ease-in;
    -webkit-appearance: none;
  }

  :global(.frequencyPopup) {
    background: red;
    color: white;
    padding: 4px 12px;
    position: absolute;
    border-radius: 4px;
    left: 50%;
    transform: translateX(-50%);
  }

  :global(.frequencyPopup::after) {
    content: "";
    position: absolute;
    width: 2px;
    height: 2px;
    background: red;
    top: -1px;
    left: 50%;
  }
  :global(input[type=range]) {
    -webkit-appearance: none;
    margin: 20px 0;
    width: 100%;
  }

  :global(input[type=range]:focus) {
    outline: none;
  }

  :global(input[type=range]::-webkit-slider-runnable-track) {
    width: 100%;
    height: 2px;
    cursor: pointer;
    background: #ced9e1;
    border-radius: 25px;
  }

  :global(input[type=range]::-webkit-slider-thumb) {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #1b3b52;
    box-shadow: 0 0 4px 0 rgba(0,0,0, 1);
    cursor: pointer;
    -webkit-appearance: none;
    margin-top: -8px;
  }

  :global(input[type=range]:focus::-webkit-slider-runnable-track) {
    background: #ced9e1;
  }

  :global(.range-wrap) {
    width: 500px;
    position: relative;
  }

  :global(.range-value) {
    position: absolute;
    top: -50%;
  }

  :global(.range-value span) {
    width: 30px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    background: #03a9f4;
    color: #fff;
    font-size: 12px;
    display: block;
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0);
    border-radius: 6px;
  }

  :global(.range-value span:before) {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    border-top: 10px solid #03a9f4;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    margin-top: -1px;
  }
</style>