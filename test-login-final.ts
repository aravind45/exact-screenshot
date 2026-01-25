import { AuthService } from './server/services/authService.js'

async function main() {
    const email = 'aravind.77479@gmail.com'
    const password = 'password'

    try {
        const result = await AuthService.login(email, password)
        console.log('Login successful for:', result.user.email)
        console.log('Token generated:', !!result.token)
    } catch (error: any) {
        console.error('Login failed:', error.message)
    }
}

main()
