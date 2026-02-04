import { PlayerController } from './PlayerController.js';
import { WeaponSystem } from './WeaponSystem.js';
import { Map } from './Map.js';

class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.weaponSystem = null;
        this.map = null;
        this.isPaused = false;
        this.isGameStarted = false;
        this.yandexSDK = null;

        // Элементы UI
        this.menuElement = document.getElementById('menu');
        this.hudElement = document.getElementById('hud');
        this.pauseMenuElement = document.getElementById('pauseMenu');
        this.gameContainer = document.getElementById('gameContainer');

        this.init();
    }

    async init() {
        // Инициализация Яндекс SDK
        try {
            this.yandexSDK = await YaGames.init();
            console.log('Яндекс SDK инициализирован');
        } catch (error) {
            console.warn('Яндекс SDK не загружен, используется заглушка');
        }

        // Настройка кнопок меню
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('resumeButton').addEventListener('click', () => this.resumeGame());
        document.getElementById('exitButton').addEventListener('click', () => this.exitToMenu());

        // Обработка ESC для паузы
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.isGameStarted) {
                if (this.isPaused) {
                    this.resumeGame();
                } else {
                    this.pauseGame();
                }
            }
        });

        console.log('Игра инициализирована. Нажмите "Начать игру"');
    }

    startGame() {
        if (this.isGameStarted) return;

        // Скрываем меню, показываем HUD
        this.menuElement.classList.add('hidden');
        this.hudElement.classList.remove('hidden');

        // Инициализация Three.js
        this.initThree();

        // Создание карты
        this.map = new Map(this.scene);

        // Создание игрока
        this.player = new PlayerController(this.camera, this.map);

        // Создание системы оружия
        this.weaponSystem = new WeaponSystem(this.camera, this.scene, this.map);

        // Запуск игрового цикла
        this.isGameStarted = true;
        this.animate();

        console.log('Игра запущена');
    }

    initThree() {
        // Создание сцены
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 0, 300);

        // Создание камеры
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.7, 0);

        // Создание рендерера
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.gameContainer.appendChild(this.renderer.domElement);

        // Обработка изменения размера окна
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    pauseGame() {
        if (this.isPaused) return;

        this.isPaused = true;
        this.pauseMenuElement.classList.remove('hidden');
        
        // Освобождаем курсор
        if (this.player) {
            this.player.unlock();
        }

        console.log('Игра на паузе');
    }

    resumeGame() {
        if (!this.isPaused) return;

        this.isPaused = false;
        this.pauseMenuElement.classList.add('hidden');

        // Захватываем курсор снова
        if (this.player) {
            this.player.lock();
        }

        console.log('Игра возобновлена');
    }

    exitToMenu() {
        // Останавливаем игру
        this.isGameStarted = false;
        this.isPaused = false;

        // Очищаем сцену
        if (this.renderer) {
            this.gameContainer.removeChild(this.renderer.domElement);
        }

        // Показываем меню
        this.menuElement.classList.remove('hidden');
        this.hudElement.classList.add('hidden');
        this.pauseMenuElement.classList.add('hidden');

        // Сброс переменных
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.weaponSystem = null;
        this.map = null;

        console.log('Выход в главное меню');
    }

    animate() {
        if (!this.isGameStarted) return;

        requestAnimationFrame(() => this.animate());

        if (!this.isPaused) {
            const delta = 0.016; // ~60 FPS

            // Обновление игрока
            if (this.player) {
                this.player.update(delta);
            }

            // Обновление системы оружия
            if (this.weaponSystem) {
                this.weaponSystem.update(delta);
            }

            // Рендеринг
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        }
    }
}

// Запуск игры при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
