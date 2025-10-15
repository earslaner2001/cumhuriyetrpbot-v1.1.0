// Admin Panel Giriş Testi
import fetch from 'node-fetch';
import fs from 'fs';

async function testAdminLogin() {
    console.log('🧪 Admin Panel Giriş Testi Başlatılıyor...\n');
    
    const baseUrl = 'http://localhost:3000';
    
    try {
        // 1. Ana sayfayı test et
        console.log('📄 1. Ana sayfa testi...');
        const homeResponse = await fetch(baseUrl);
        if (homeResponse.ok) {
            console.log('✅ Ana sayfa erişilebilir (200)');
        } else {
            console.log('❌ Ana sayfa hatası:', homeResponse.status);
        }
        
        // 2. Admin giriş sayfasını test et
        console.log('\n🔐 2. Admin giriş sayfası testi...');
        const adminPageResponse = await fetch(`${baseUrl}/admin`);
        if (adminPageResponse.ok) {
            console.log('✅ Admin giriş sayfası erişilebilir (200)');
        } else {
            console.log('❌ Admin giriş sayfası hatası:', adminPageResponse.status);
        }
        
        // 3. Session cookies için cookie jar oluştur
        const cookieJar = [];
        
        // 4. Admin giriş yapmayı dene
        console.log('\n🚀 3. Admin giriş işlemi testi...');
        const loginData = new URLSearchParams({
            username: 'admin',
            password: '123456'
        });
        
        const loginResponse = await fetch(`${baseUrl}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: loginData,
            redirect: 'manual' // Yönlendirmeyi manuel kontrol et
        });
        
        console.log('📊 Login response status:', loginResponse.status);
        console.log('🍪 Set-Cookie headers:', loginResponse.headers.get('set-cookie'));
        
        if (loginResponse.status === 302) {
            const location = loginResponse.headers.get('location');
            console.log('✅ Giriş başarılı! Yönlendirme:', location);
            
            // Cookies'i kaydet
            const setCookieHeader = loginResponse.headers.get('set-cookie');
            if (setCookieHeader) {
                cookieJar.push(setCookieHeader);
                console.log('🍪 Session cookie kaydedildi');
            }
            
            // 5. Dashboard'a erişmeyi dene
            console.log('\n📊 4. Dashboard erişim testi...');
            const dashboardResponse = await fetch(`${baseUrl}/admin/dashboard`, {
                headers: {
                    'Cookie': cookieJar.join('; ')
                }
            });
            
            if (dashboardResponse.ok) {
                console.log('✅ Dashboard erişimi başarılı (200)');
                console.log('📄 Dashboard content-type:', dashboardResponse.headers.get('content-type'));
            } else {
                console.log('❌ Dashboard erişim hatası:', dashboardResponse.status);
            }
            
        } else {
            console.log('❌ Giriş başarısız! Status:', loginResponse.status);
            const responseText = await loginResponse.text();
            console.log('📄 Response body length:', responseText.length);
            
            // Hata mesajını ara
            if (responseText.includes('Geçersiz kullanıcı adı')) {
                console.log('🔍 Hata mesajı bulundu: Geçersiz kullanıcı adı/şifre');
            } else if (responseText.includes('Admin Girişi')) {
                console.log('🔍 Admin giriş sayfası döndü - form hatası olabilir');
            }
            
            // Response'u dosyaya kaydet
            fs.writeFileSync('debug-response.html', responseText);
            console.log('💾 Response debug-response.html dosyasına kaydedildi');
        }
        
        // 6. Logout testi
        console.log('\n🚪 5. Logout testi...');
        const logoutResponse = await fetch(`${baseUrl}/admin/logout`, {
            method: 'POST',
            headers: {
                'Cookie': cookieJar.join('; ')
            },
            redirect: 'manual'
        });
        
        if (logoutResponse.status === 302) {
            console.log('✅ Logout başarılı! Yönlendirme:', logoutResponse.headers.get('location'));
        } else {
            console.log('❌ Logout hatası:', logoutResponse.status);
        }
        
        console.log('\n🎉 Test tamamlandı!');
        
    } catch (error) {
        console.error('💥 Test sırasında hata:', error.message);
    }
}

// Test çalıştır
testAdminLogin();