<script>
  import { Router, Link, Route } from "svelte-routing";
  import Configuration from "./routes/Configuration.svelte";
  import Home from "./routes/Home.svelte";

  export let url = "";
</script>

<Router url="{url}">
  <div>
    <div class='logo'>
      <img src='./images/airnote.svg' alt="Airnote Logo" />
    </div>
    <Route path="/:deviceUID" component="{Configuration}" />
    <Route path="/"><Home /></Route>
  </div>
</Router>

<style>
	@import 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css';

  :global(.logo) {
		background-color: #1B3A52;
		width: 100%;
		height: 200px;
		padding: 0;
		margin: 0;
		text-align: center;
	}

	:global(.logo img) {
		margin-top: 80px;
	}

  :global(.btn) {
    color: #f4f4f4;
  }
</style>