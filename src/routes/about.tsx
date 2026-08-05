import { dynamic } from '@solidjs/web';
import { createFileRoute } from '@tanstack/solid-router'
import { getAboutPage } from '../api';

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  const AboutUs = dynamic(() => getAboutPage());
  return (
    <AboutUs button={(props: { id: number }) => <button onClick={() => console.log(props.id)}>Click me {props.id}</button>} />
  )
}
