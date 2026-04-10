import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '../app/page'
 
test('renders Vercel button', () => {
  render(<Home />)
  expect(screen.getByText('Deploy Now')).toBeInTheDocument()
})

