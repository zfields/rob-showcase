<script>
  import {
		Container,
		Jumbotron,
		Nav,
		Navbar,
		NavItem,
		NavLink,
		Col,
		Row } from 'sveltestrap';
	import Settings from './Settings.svelte';
	import Owner from './Owner.svelte';
</script>

<main>
	<Container>
		<Row>
			<Col><h1>Airnote</h1></Col>
		</Row>

		<Navbar>
			<Col><h4>Safecast</h4></Col>
			<Nav>
				<NavItem>
					<NavLink href="#">Device Charts</NavLink>
				</NavItem>
				<div class="separator">|</div>
				<NavItem>
					<NavLink href="#">Global Map</NavLink>
				</NavItem>
			</Nav>
		</Navbar>

		<Jumbotron class="no-bg">
			<h5>
				Thank you for joining the global Airnote network!
			</h5>
			<p>You're now part of a community of citizens helping to
				monitor the air we breathe.</p><p>Use the fields below to
				personalize your device, or click the links above to
				view charts for your device and the global Safecast map.
			</p>
			<hr class="my-4" />
			<p>
				<i>
					For help setting-up your Airnote, visit
					<a href="https://start.airnote.live">start.airnote.live</a>.
				</i>
			</p>
		</Jumbotron>

		<Settings />
		<hr class="my-4" />
		<Owner />

		<hr class="my-4" />
		<Row>
			<Col>
				<i>
					By using your Airnote device, or completing the optional fields
					on this page, you consent to share your device data and the optional
					contact information with Blues Inc. for the purposes of publishing
					public maps and device dashboards.
				</i>
			</Col>
		</Row>

		<hr class="my-4" />
		<Row>
			<Col>
				Cloud-connected by <br/>
				<a target="_blank" href="https://blues.io/products">Notecard</a>
			</Col>
		</Row>
		<br/>
		<Row>
			<Col>
				Developed by <br/>
				<a target="_blank" href="https://blues.io">Blues Inc.</a>
			</Col>
		</Row>
	</Container>
</main>

<style>
	@import "https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css";

	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	:global(.no-bg) {
		background-color: #fff;
	}

	.separator {
		font-size: 1.5rem;
		color: #d9e0e7;
	}

	:global(a) {
		color: #56d0ff;
	}

	:global(.btn) {
		background-color: #2db9ff;
		border-color: #2db9ff;
	}

	:global(.jumbotron) {
		margin-bottom: 0;
		padding: 0;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>