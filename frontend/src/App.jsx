import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import HowItWorks from "./components/HowItWorks"

function App() {
  return (
    <div className="min-h-screen bg-[#08090D] text-white">
      <Navbar />

      <main>
        <Hero />
        <HowItWorks />
      </main>
    </div>
  )
}

export default App