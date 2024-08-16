const puppeteer = require("puppeteer");
const dotenv = require("dotenv");

dotenv.config();

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const GITUSERNAME = process.env.GITUSERNAME;

describe("Automação de login no GitHub", () => {
  let browser;
  let page;

  // Antes de todos os testes
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
    }); // Abre o navegador
    page = await browser.newPage(); // Abre uma nova página
  });

  // Depois de todos os testes
  afterAll(async () => {
    await browser.close(); // Fecha o navegador
  });

  // Teste de login no GitHub
  it("Deve logar no GitHub e validar usuário", async () => {
    // Acessar página inicial do GitHub
    await page.goto("https://github.com", { waitUntil: "networkidle2" });

    // Acessar página de login
    await page.click('a[href="/login"]');
    await page.waitForSelector("#login_field");

    // Preencher formulário de login
    await page.type("#login_field", EMAIL);
    await page.type("#password", PASSWORD);

    // Efetuar autenticação
    await page.click('input[name="commit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // Validar se a autenticação foi bem sucedida
    const url = page.url();
    console.log(`Accessed Url: ${url}`);
    expect(url).toBe("https://github.com/");

    // Validar o nome do usuário
    await page.click(
      'button[class="Button--invisible Button--medium Button Button--invisible-noVisuals color-bg-transparent p-0"]'
    );
    const userName = await page.$eval(`div[title="${GITUSERNAME}"]`,(el) => el.innerText);
    expect(userName).toBe(GITUSERNAME);
  });

  it("Deve navegar até o repositório e acessar", async () => {
    // Navegar até a aba “Repositories”
    await page.click(`a[href="/${GITUSERNAME}?tab=repositories"]`);

    // Esperar os repositórios carregarem
    await page.waitForSelector('li[itemprop="owns"]');

    // Selecionar um repositório aleatório
    const repos = await page.$$eval('li[itemprop="owns"] a', (links) =>
      links.map((link) => link.href)
    );
    const randomRepo = repos[Math.floor(Math.random() * repos.length)];

    // Acessar o repositório aleatório
    await page.goto(randomRepo);

    // Validar se acessou o repositório
    const repoName = await page.$eval(
      'strong[itemprop="name"] a',
      (el) => el.textContent
    );
    console.log(`Accessed Repository: ${repoName}`);
    expect(page.url()).toContain(randomRepo);

    // Navegar para a aba "Pull Requests" do repositório
    await page.click('span[data-content="Pull requests"]');
    await page.waitForNavigation();
  });

  it("Deve criar um novo repositório, acessar e tirar um print", async () => {
    // Navegar até a pagina principal
    await page.click('a[href="https://github.com/"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    await page.waitForSelector('input[name="repository[name]"]');

    //Prencheer o nome do novo repositório
    const NEW_REPO_NAME = "Teste";
    const repoNameXPath = 'xpath/.//*[@id="repository[name]"]';
    await page.waitForSelector(`${repoNameXPath}`);
    const repoNameInput = await page.$$(repoNameXPath);
    await repoNameInput[0].type(NEW_REPO_NAME);

    //Clicar no botão de publico
    const publicButtonXPath = 'xpath/.//*[@id="repository[visibility]_public"]';
    await page.waitForSelector(`${publicButtonXPath}`);
    const publicButton = await page.$$(publicButtonXPath);
    await publicButton[0].click();

    //Clicar no botão de criar novo repositório
    await page.click(
      'xpath/.//button[@data-disable-with="Create a new repository"]'
    );
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    //Tirar print da tela
    await page.screenshot({ path: "img/repositorio_teste.png" });
  });

  it("Deve deslogar e validar", async () => {
    // Deslogar
    await page.click(
      'button[class="Button--invisible Button--medium Button Button--invisible-noVisuals color-bg-transparent p-0"]'
    );
    await page.click('a[href="/logout"]');
    await page.waitForNavigation();
    await page.locator('input[value="Sign out"]').click();
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // Validar que foi possível deslogar
    const loggedOutUrl = page.url();
    console.log(`Logout Successfully: ${loggedOutUrl}`);
    expect(loggedOutUrl).toBe("https://github.com/");
  });
});
