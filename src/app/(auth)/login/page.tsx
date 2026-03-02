import { login } from '../actions'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Log in to your account</h2>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Or{' '}
                        <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                            create a new organization account
                        </a>
                    </p>
                </div>

                <form className="mt-8 space-y-6" action={login}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 block w-full rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="mt-1 block w-full rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
