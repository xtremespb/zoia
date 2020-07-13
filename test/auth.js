const { Builder, By, Key, until } = require('selenium-webdriver');

(async function example() {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        await driver.manage().window().maximize();
        await driver.get('http://127.0.0.1:3000/auth/register');
        await driver.wait(until.titleIs('Register | Example Website powered by Zoia Web Framework'), 5000);
        await driver.wait(until.elementLocated(By.id('zoiaRegister_username')), 5000);
        const username = 'test' + Date.now();
        await driver.findElement(By.id('zoiaRegister_username')).sendKeys(username);
        await driver.findElement(By.id('zoiaRegister_email')).sendKeys(`${username}@zoiajs.org`);
        await driver.findElement(By.id('zoiaRegister_password')).sendKeys('TestTest');
        await driver.findElement(By.id('zoiaRegister_passwordConfirm')).sendKeys('TestTest');
        await driver.findElement(By.id('zoiaRegister_captcha')).sendKeys('1111');
        await driver.findElement(By.id('zoiaRegister_username')).sendKeys(Key.RETURN);
        await driver.wait(until.elementLocated(By.id('registrationSuccessful')), 5000);
        await driver.wait(until.elementIsVisible(await driver.findElement(By.id('registrationSuccessful'))), 5000);
        await driver.get(`http://127.0.0.1:3000/auth/register/confirm?username=${username}&code=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`);
        await driver.wait(until.elementLocated(By.id('confirmSuccess')), 5000);
        await driver.wait(until.elementIsVisible(await driver.findElement(By.id('confirmSuccess'))), 5000);
        await driver.get('http://127.0.0.1:3000/auth?redirect=/account');
        await driver.wait(until.titleIs('Log in | Example Website powered by Zoia Web Framework'), 5000);
        await driver.wait(until.elementLocated(By.id('zoiaAuth_username')), 5000);
        await driver.findElement(By.id('zoiaAuth_username')).sendKeys(username);
        await driver.findElement(By.id('zoiaAuth_password')).sendKeys('TestTest', Key.RETURN);
        await driver.wait(until.titleIs('Your Account | Example Website powered by Zoia Web Framework'), 5000);
        await driver.get('http://127.0.0.1:3000/auth/logout');
        await driver.wait(until.titleIs('Home page | Example Website powered by Zoia Web Framework'), 5000);
        await driver.get('http://127.0.0.1:3000/auth/reset');
        await driver.wait(until.titleIs('Reset password | Example Website powered by Zoia Web Framework'), 5000);
        await driver.wait(until.elementLocated(By.id('zoiaReset_email')), 5000);
        await driver.findElement(By.id('zoiaReset_captcha')).sendKeys('1111');
        await driver.findElement(By.id('zoiaReset_email')).sendKeys(`${username}@zoiajs.org`, Key.RETURN);
        await driver.wait(until.elementLocated(By.id('requestSuccessful')), 5000);
        await driver.wait(until.elementIsVisible(await driver.findElement(By.id('requestSuccessful'))), 5000);
        await driver.get(`http://127.0.0.1:3000/auth/reset/confirm?username=${username}&code=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&password=password`);
        await driver.wait(until.elementLocated(By.id('zoiaResetConfirm_password')), 5000);
        await driver.findElement(By.id('zoiaResetConfirm_password')).sendKeys('NewTestTest');
        await driver.findElement(By.id('zoiaResetConfirm_passwordConfirm')).sendKeys('NewTestTest', Key.RETURN);
        await driver.wait(until.elementLocated(By.id('resetConfirmSuccessful')), 5000);
        await driver.wait(until.elementIsVisible(await driver.findElement(By.id('resetConfirmSuccessful'))), 5000);
        await driver.get('http://127.0.0.1:3000/auth?redirect=/account');
        await driver.wait(until.titleIs('Log in | Example Website powered by Zoia Web Framework'), 5000);
        await driver.wait(until.elementLocated(By.id('zoiaAuth_username')), 5000);
        await driver.findElement(By.id('zoiaAuth_username')).sendKeys(username);
        await driver.findElement(By.id('zoiaAuth_password')).sendKeys('NewTestTest', Key.RETURN);
        await driver.wait(until.titleIs('Your Account | Example Website powered by Zoia Web Framework'), 5000);
        console.log('All tests OK.');
    } catch (e) {
        console.log(e);
    } finally {
        await driver.quit();
        console.log('Done.');
    }
})();