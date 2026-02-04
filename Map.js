export class Map {
    constructor(scene) {
        this.scene = scene;
        this.colliders = [];
        this.enemies = [];

        this.createEnvironment();
        this.createLighting();
        this.createMilitaryStructures();
        this.createBattlefield();
        this.createEnemies();
        this.createAmbientEffects();
    }

    createEnvironment() {
        // Земля с текстурой (грязь, трава)
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a5a3a,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Добавляем неровности для реалистичности
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = Math.random() * 0.5;
        }
        groundGeometry.attributes.position.needsUpdate = true;
        groundGeometry.computeVertexNormals();
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        
        this.scene.add(ground);
        
        // Создаем невидимый коллайдер для пола
        const floorCollider = new THREE.Mesh(
            new THREE.BoxGeometry(200, 0.1, 200),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        floorCollider.position.y = 0;
        floorCollider.geometry.computeBoundingBox();
        this.colliders.push(floorCollider);
        this.scene.add(floorCollider);

        // Периметр - стены из бетона
        this.createWall(0, 3, -100, 200, 6, 2, 0x808080); // Дальняя стена
        this.createWall(0, 3, 100, 200, 6, 2, 0x808080);  // Ближняя стена
        this.createWall(-100, 3, 0, 2, 6, 200, 0x808080); // Левая стена
        this.createWall(100, 3, 0, 2, 6, 200, 0x808080);  // Правая стена

        console.log('Военное окружение создано');
    }

    createWall(x, y, z, width, height, depth, color) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.95,
            metalness: 0.05
        });
        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        wall.geometry.computeBoundingBox();
        
        this.scene.add(wall);
        this.colliders.push(wall);
        
        return wall;
    }

    createLighting() {
        // Ambient - тусклое военное освещение
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);

        // Солнце (направленный свет)
        const sun = new THREE.DirectionalLight(0xffffcc, 1.2);
        sun.position.set(50, 100, 30);
        sun.castShadow = true;
        
        sun.shadow.mapSize.width = 4096;
        sun.shadow.mapSize.height = 4096;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 200;
        sun.shadow.camera.left = -100;
        sun.shadow.camera.right = 100;
        sun.shadow.camera.top = 100;
        sun.shadow.camera.bottom = -100;
        
        this.scene.add(sun);

        // Прожекторы на базе
        this.createSpotlight(-40, 10, -40, 0xff9900);
        this.createSpotlight(40, 10, -40, 0xff9900);
        this.createSpotlight(-40, 10, 40, 0xff9900);
        this.createSpotlight(40, 10, 40, 0xff9900);

        // Сигнальные огни
        this.createWarningLight(-30, 5, -50, 0xff0000);
        this.createWarningLight(30, 5, -50, 0xff0000);

        console.log('Военное освещение создано');
    }

    createSpotlight(x, y, z, color) {
        const spotlight = new THREE.SpotLight(color, 2, 50, Math.PI / 6, 0.5);
        spotlight.position.set(x, y, z);
        spotlight.castShadow = true;
        spotlight.target.position.set(x, 0, z);
        this.scene.add(spotlight);
        this.scene.add(spotlight.target);
    }

    createWarningLight(x, y, z, color) {
        const light = new THREE.PointLight(color, 2, 20);
        light.position.set(x, y, z);
        this.scene.add(light);
        
        // Анимация мигания
        setInterval(() => {
            light.intensity = light.intensity > 0 ? 0 : 2;
        }, 500);
    }

    createMilitaryStructures() {
        // Центральное командное здание
        this.createBuilding(0, 5, -60, 20, 10, 15, 0x4a4a4a);
        
        // Сторожевые вышки по углам
        this.createWatchTower(-60, -60);
        this.createWatchTower(60, -60);
        this.createWatchTower(-60, 60);
        this.createWatchTower(60, 60);

        // Бункеры
        this.createBunker(-40, -20);
        this.createBunker(40, -20);
        this.createBunker(-40, 20);
        this.createBunker(40, 20);

        // Склады
        this.createWarehouse(-70, 0);
        this.createWarehouse(70, 0);

        // Заборы и препятствия
        this.createFence(-30, 0, 60, 'horizontal');
        this.createFence(30, 0, 60, 'horizontal');
        this.createFence(0, -30, 60, 'vertical');
        this.createFence(0, 30, 60, 'vertical');

        console.log('Военные структуры созданы');
    }

    createBuilding(x, y, z, width, height, depth, color) {
        const building = this.createBox(x, y, z, width, height, depth, color);
        
        // Добавляем окна
        for (let i = 0; i < 3; i++) {
            const window1 = this.createBox(x - width/3, y + 2 + i*3, z + depth/2 + 0.1, 2, 1.5, 0.2, 0x333333);
            const window2 = this.createBox(x + width/3, y + 2 + i*3, z + depth/2 + 0.1, 2, 1.5, 0.2, 0x333333);
        }
        
        return building;
    }

    createWatchTower(x, z) {
        // Основание вышки
        this.createBox(x, 0.5, z, 4, 1, 4, 0x654321);
        
        // Столбы
        this.createCylinder(x - 1.5, 5, z - 1.5, 0.3, 10, 0x4a4a4a);
        this.createCylinder(x + 1.5, 5, z - 1.5, 0.3, 10, 0x4a4a4a);
        this.createCylinder(x - 1.5, 5, z + 1.5, 0.3, 10, 0x4a4a4a);
        this.createCylinder(x + 1.5, 5, z + 1.5, 0.3, 10, 0x4a4a4a);
        
        // Платформа наверху
        this.createBox(x, 10, z, 5, 0.5, 5, 0x654321);
        
        // Крыша
        const roofGeometry = new THREE.ConeGeometry(3, 2, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(x, 12, z);
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        this.scene.add(roof);
    }

    createBunker(x, z) {
        // Основной корпус бункера
        this.createBox(x, 1.5, z, 8, 3, 6, 0x556B2F);
        
        // Крыша бункера (наклонная)
        this.createBox(x, 3.5, z, 8.5, 0.5, 6.5, 0x4a5a3a);
        
        // Вход
        this.createBox(x, 1, z + 3.5, 2, 2, 0.5, 0x333333);
        
        // Амбразуры для стрельбы
        this.createBox(x - 3, 2, z, 0.3, 0.5, 0.8, 0x000000);
        this.createBox(x + 3, 2, z, 0.3, 0.5, 0.8, 0x000000);
    }

    createWarehouse(x, z) {
        // Большой склад
        this.createBox(x, 4, z, 15, 8, 10, 0x696969);
        
        // Большие ворота
        this.createBox(x, 3, z + 5.5, 8, 6, 0.5, 0x8B4513);
    }

    createFence(x, z, length, orientation) {
        const segments = Math.floor(length / 2);
        for (let i = 0; i < segments; i++) {
            if (orientation === 'horizontal') {
                this.createBox(x + (i - segments/2) * 2, 1.5, z, 0.2, 3, 2, 0x8B4513);
            } else {
                this.createBox(x, 1.5, z + (i - segments/2) * 2, 2, 3, 0.2, 0x8B4513);
            }
        }
    }

    createBattlefield() {
        // Окопы
        this.createTrench(-20, -15);
        this.createTrench(20, -15);
        this.createTrench(-20, 15);
        this.createTrench(20, 15);

        // Разрушенная техника
        this.createDestroyedTank(-50, -30);
        this.createDestroyedTank(50, 30);

        // Мешки с песком
        this.createSandbagWall(-10, -25, 8);
        this.createSandbagWall(10, -25, 8);
        this.createSandbagWall(-10, 25, 8);
        this.createSandbagWall(10, 25, 8);

        // Колючая проволока
        this.createBarbedWire(-30, -40, 20);
        this.createBarbedWire(30, -40, 20);

        // Ящики с боеприпасами
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            this.createAmmoBox(x, z);
        }

        // Бочки
        for (let i = 0; i < 10; i++) {
            const x = (Math.random() - 0.5) * 70;
            const z = (Math.random() - 0.5) * 70;
            this.createBarrel(x, z);
        }

        console.log('Поле боя создано');
    }

    createTrench(x, z) {
        // Длинный окоп
        for (let i = 0; i < 10; i++) {
            this.createBox(x + i * 1.5, 0.8, z, 1.5, 1.6, 3, 0x4a3a2a);
        }
    }

    createDestroyedTank(x, z) {
        // Корпус танка
        this.createBox(x, 1, z, 5, 2, 8, 0x3a3a3a);
        // Башня
        this.createBox(x, 2.5, z - 1, 3, 1.5, 3, 0x3a3a3a);
        // Поврежденная пушка
        this.createCylinder(x, 2.5, z - 3, 0.3, 4, 0x2a2a2a);
    }

    createSandbagWall(x, z, length) {
        for (let i = 0; i < length; i++) {
            const offset = (i % 2) * 0.3;
            this.createBox(x + i * 1, 0.5 + offset, z, 1, 0.6, 1.5, 0xD2B48C);
        }
    }

    createBarbedWire(x, z, length) {
        for (let i = 0; i < length; i += 2) {
            this.createCylinder(x + i, 0.8, z, 0.05, 1.6, 0x666666);
        }
    }

    createAmmoBox(x, z) {
        const box = this.createBox(x, 0.4, z, 0.8, 0.8, 0.8, 0x4a4a2a);
        // Добавляем надпись/маркировку
        this.createBox(x, 0.5, z + 0.41, 0.6, 0.3, 0.05, 0xffff00);
    }

    createBarrel(x, z) {
        this.createCylinder(x, 0.9, z, 0.5, 1.8, 0xff4500);
    }

    createBox(x, y, z, width, height, depth, color) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.85,
            metalness: 0.15
        });
        const box = new THREE.Mesh(geometry, material);
        box.position.set(x, y, z);
        box.castShadow = true;
        box.receiveShadow = true;
        box.geometry.computeBoundingBox();
        
        this.scene.add(box);
        this.colliders.push(box);
        
        return box;
    }

    createCylinder(x, y, z, radius, height, color) {
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.8,
            metalness: 0.3
        });
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.position.set(x, y, z);
        cylinder.castShadow = true;
        cylinder.receiveShadow = true;
        
        const box = new THREE.Box3().setFromObject(cylinder);
        cylinder.geometry.boundingBox = box;
        
        this.scene.add(cylinder);
        this.colliders.push(cylinder);
        
        return cylinder;
    }

    createEnemies() {
        // Создаем вражеских солдат
        const enemyPositions = [
            [-45, 1.7, -50],
            [45, 1.7, -50],
            [-45, 1.7, 50],
            [45, 1.7, 50],
            [-60, 11, -60], // На вышке
            [60, 11, -60],  // На вышке
            [0, 1.7, -70],
            [-30, 1.7, -30],
            [30, 1.7, -30],
            [-30, 1.7, 30],
            [30, 1.7, 30],
            [0, 1.7, 40],
        ];

        enemyPositions.forEach((pos, index) => {
            this.createEnemy(pos[0], pos[1], pos[2], index);
        });

        console.log(`Создано ${this.enemies.length} противников`);
    }

    createEnemy(x, y, z, id) {
        // Тело врага (простая модель)
        const bodyGroup = new THREE.Group();

        // Голова
        const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.75;
        head.castShadow = true;
        bodyGroup.add(head);

        // Тело
        const bodyGeometry = new THREE.BoxGeometry(0.7, 1, 0.4);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2a4a2a });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        bodyGroup.add(body);

        // Ноги
        const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a2a });
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.2, -0.9, 0);
        leftLeg.castShadow = true;
        bodyGroup.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.2, -0.9, 0);
        rightLeg.castShadow = true;
        bodyGroup.add(rightLeg);

        // Руки
        const armGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
        const armMaterial = new THREE.MeshStandardMaterial({ color: 0x2a4a2a });
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.5, 0.2, 0);
        leftArm.castShadow = true;
        bodyGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.5, 0.2, 0);
        rightArm.castShadow = true;
        bodyGroup.add(rightArm);

        // Оружие в руках
        const weaponGeometry = new THREE.BoxGeometry(0.1, 0.1, 1);
        const weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        weapon.position.set(0.3, 0.2, -0.5);
        weapon.rotation.y = -Math.PI / 8;
        weapon.castShadow = true;
        bodyGroup.add(weapon);

        bodyGroup.position.set(x, y, z);
        
        // Враг смотрит в сторону центра карты
        const angleToCenter = Math.atan2(0 - z, 0 - x);
        bodyGroup.rotation.y = angleToCenter;

        this.scene.add(bodyGroup);

        // Добавляем красный маркер над головой
        const markerGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(x, y + 1.5, z);
        this.scene.add(marker);

        // Анимация маркера
        const animateMarker = () => {
            if (marker.parent) {
                marker.position.y = y + 1.5 + Math.sin(Date.now() * 0.003) * 0.2;
                requestAnimationFrame(animateMarker);
            }
        };
        animateMarker();

        // Сохраняем данные врага
        this.enemies.push({
            id: id,
            group: bodyGroup,
            marker: marker,
            health: 100,
            position: new THREE.Vector3(x, y, z),
            isAlive: true
        });

        // Добавляем коллайдер для врага
        const enemyCollider = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 1.7, 0.7),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        enemyCollider.position.set(x, y, z);
        enemyCollider.geometry.computeBoundingBox();
        enemyCollider.userData = { isEnemy: true, enemyId: id };
        this.colliders.push(enemyCollider);
        this.scene.add(enemyCollider);
    }

    createAmbientEffects() {
        // Дым от пожаров/разрушений
        for (let i = 0; i < 3; i++) {
            const x = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            this.createSmoke(x, z);
        }
    }

    createSmoke(x, z) {
        // Простой эффект дыма
        const smokeGeometry = new THREE.SphereGeometry(2, 8, 8);
        const smokeMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.3
        });
        const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smoke.position.set(x, 3, z);
        this.scene.add(smoke);

        // Анимация дыма
        const animateSmoke = () => {
            if (smoke.parent) {
                smoke.position.y = 3 + Math.sin(Date.now() * 0.001) * 1;
                smoke.scale.set(
                    1 + Math.sin(Date.now() * 0.002) * 0.2,
                    1 + Math.cos(Date.now() * 0.002) * 0.2,
                    1
                );
                requestAnimationFrame(animateSmoke);
            }
        };
        animateSmoke();
    }

    getColliders() {
        return this.colliders;
    }

    getEnemies() {
        return this.enemies;
    }

    damageEnemy(enemyId, damage) {
        const enemy = this.enemies.find(e => e.id === enemyId);
        if (enemy && enemy.isAlive) {
            enemy.health -= damage;
            console.log(`Враг ${enemyId} получил ${damage} урона. HP: ${enemy.health}`);

            if (enemy.health <= 0) {
                enemy.isAlive = false;
                // Убираем врага со сцены
                this.scene.remove(enemy.group);
                this.scene.remove(enemy.marker);
                console.log(`Враг ${enemyId} уничтожен!`);
                return true; // Враг убит
            }
        }
        return false;
    }
}
