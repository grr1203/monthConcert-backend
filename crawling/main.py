import json
import time
from selenium import webdriver
from tempfile import mkdtemp
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from bs4 import BeautifulSoup
import os
# import pickle


def handler(event, context=''):
    print('request: {}'.format(json.dumps(event)))

    body = json.loads(event['body'])
    # artistAccount = body['artistAccount']
    artistAccount = 'younha_holic'
    # os.environ["STAGE"] = 'Dev'

    print("artistAccount", artistAccount)

    print("STAGE", os.environ["STAGE"])

    chrome_driver_path = "/opt/chromedriver"
    chrome_binary_path = "/opt/chrome/chrome"
    if os.environ["STAGE"] == 'test':
        chrome_driver_path = './chrome/chromedriver'
        chrome_binary_path = ''

    options = webdriver.ChromeOptions()
    service = webdriver.ChromeService(chrome_driver_path)

    options.binary_location = chrome_binary_path
    # options.add_argument("--headless=new")
    # options.add_argument("--headless")

    if os.environ["STAGE"] != 'test':
        options.add_argument("--headless")
        options.add_argument('--no-sandbox')
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1280x1696")
        options.add_argument("--single-process")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-dev-tools")
        options.add_argument("--no-zygote")
        options.add_argument(f"--user-data-dir={mkdtemp()}")
        options.add_argument(f"--data-path={mkdtemp()}")    
        options.add_argument(f"--disk-cache-dir={mkdtemp()}")
        options.add_argument("--remote-debugging-port=9222")
        options.add_argument(
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.57 Safari/537.36")

    print('options', options.arguments)

    browser = webdriver.Chrome(options=options, service=service)

    # login
    browser.get("https://www.instagram.com")
    print("res status", browser.title)

    username = "zzipwooung@gmail.com"
    password = "zxc123ZXC!@#"

    username_input = WebDriverWait(browser, 5).until(
        EC.visibility_of_element_located(
            (By.CSS_SELECTOR, 'input[name="username"]'))
    )

    # Find the username input field and type the username
    username_input = browser.find_element(
        By.CSS_SELECTOR, 'input[name="username"]')
    username_input.send_keys(username)

    # Find the password input field and type the password
    password_input = browser.find_element(
        By.CSS_SELECTOR, 'input[name="password"]')
    password_input.send_keys(password)

    # Find the submit button and click it
    submit_button = browser.find_element(
        By.CSS_SELECTOR, 'button[type="submit"]')
    submit_button.click()

    # Wait for navigation to complete
    try:
        WebDriverWait(browser, 20).until(EC.url_changes(browser.current_url))
        print("login success")
        # pickle.dump( browser.get_cookies() , open("cookies.pkl","wb"))

    except TimeoutException as e:
        print("Timed out waiting login", e)

    print("res status", browser.title)

    browser.get(f"https://www.instagram.com/{artistAccount}")

    try:
        WebDriverWait(browser, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div._aagv"))
        )
        print("div._aagv element found")
    except TimeoutException as e:
        print("Timed out waiting for div._aagv element to appear", e)

    print("browser title", browser.title)

    content = browser.page_source

    soup = BeautifulSoup(content, "html.parser")
    # print("content", soup)

    # article = soup.find("article")
    # print("article", article)
    postingArray = soup.find_all("div", class_="_aagv")

    # filteredPostingArray = []
    # for item in postingArray:
    #     posting = {
    #         "content": item.img.get("alt"),
    #         "img": item.img.get("src")
    #     }
    #     if filterByConcertRelated(posting):
    #         concertInfo = filterConcertInfo(posting["content"])
    #         concertInfo["postingUrl"] = f"https://www.instagram.com{item.parent.parent.parent.get('href')}"
    #         if not concertInfo["date"] and not posting["postingUrl"]:
    #             print("수동확인 포스팅 저장 필요")
    #         if not filteredPostingArray or all(
    #             concertInfo["date"].sort() != item["date"].sort() for item in filteredPostingArray
    #         ):
    #             filteredPostingArray.append(concertInfo)

    # print("filteredPostingArray length", len(filteredPostingArray))
    # print("filteredPostingArray", filteredPostingArray)

    browser.quit()
    # return filteredPostingArray
    return {
        'statusCode': 200,
        'result': postingArray
    }