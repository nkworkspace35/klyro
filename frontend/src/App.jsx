import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import HowItWorks from "./components/HowItWorks"
import Features from "./components/Features"
import FinalCTA from "./components/FinalCTA"

function App() {
  return (
    <div className="min-h-screen bg-[#08090D] text-white">
      <Navbar />

      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <FinalCTA />
      </main>
    </div>
  )
}

export default App