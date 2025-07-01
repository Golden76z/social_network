import Header from "@/components/header"

export default function Home() {
  return (
    <div>
      <Header />
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Welcome Home!</h1>
        <p>This is your home page. Everything works 🎉</p>
      </main>
    </div>
  )
}