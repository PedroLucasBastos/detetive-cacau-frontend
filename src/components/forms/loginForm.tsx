function LoginForm() {
    return (
        <>
            <div className="flex items-center justify-center min-h-screen">
                <div>
                    <h1 className="text-2xl font-bold mb-4">Login</h1>
                    <form>
                        <div>
                            <label htmlFor="email">Email</label>
                            <input type="email" id="email" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password">Senha</label>
                            <input type="password" id="password" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md">Login</button>
                    </form>
                </div>
            </div>
        </>
    )
}

export default LoginForm