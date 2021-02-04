<script>
	import Settings from './Settings.svelte';
	import Owner from './Owner.svelte'
</script>

<main>
	<h1>Airnote</h1>

	<Settings />
	<Owner />
</main>

<style>
	@import "https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css";

	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>