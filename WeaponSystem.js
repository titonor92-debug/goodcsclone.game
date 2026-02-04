export class WeaponSystem {
    constructor(camera, scene, map) {
        this.camera = camera;
        this.scene = scene;
        this.map = map;

        // Оружие
        this.weapons = {
            pistol: {
                name: 'PISTOL',
                damage: 25,
                fireRate: 0.3,
                maxAmmo: 12,
                reserveAmmo: 60,
                reloadTime: 1.5,
                spread: 0.02,
                sprite: this.createWeaponSprite('#666', 60, 100)
            },
            rifle: {
                name: 'AK-47',
                damage: 30,
                fireRate: 0.1,
                maxAmmo: 30,
                reserveAmmo: 90,
                reloadTime: 2.0,
                spread: 0.05,
                sprite: this.createWeaponSprite('#444', 80, 80)
            },
            sniper: {
                name: 'AWP',
                damage: 100,
                fireRate: 1.0,
                maxAmmo: 5,
                reserveAmmo: 20,
                reloadTime: 2.5,
                spread: 0.01,
                sprite: this.createWeaponSprite('#333', 100, 60)
            }
        };

        this.currentWeapon = 'rifle';
        this.currentAmmo = this.weapons[this.currentWeapon].maxAmmo;
        this.reserveAmmo = this.weapons[this.currentWeapon].reserveAmmo;
        
        this.isReloading = false;
        this.canShoot = true;
        this.shootCooldown = 0;

        // UI элементы
        this.weaponSpriteElement = document.getElementById('weaponSprite');
        this.ammoValueElement = document.getElementById('ammoValue');
        this.reserveValueElement = document.getElementById('reserveValue');
        this.weaponNameElement = document.getElementById('weaponName');
        this.hitMarkerElement = document.getElementById('hitMarker');
        this.reloadMessageElement = document.getElementById('reloadMessage');

        // Raycaster для стрельбы
        this.raycaster = new THREE.Raycaster();

        // Визуальные эффекты
        this.bulletHoles = [];
        this.maxBulletHoles = 50;

        this.initControls();
        this.updateUI();
        this.updateWeaponSprite();
        this.updateWeaponSlots();
    }

    createWeaponSprite(color, width, height) {
        // Создаём простой SVG спрайт оружия
        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="${width}" height="${height * 0.3}" y="${height * 0.35}" fill="${color}"/>
                <rect width="${width * 0.3}" height="${height * 0.5}" x="${width * 0.7}" y="${height * 0.2}" fill="${color}"/>
                <rect width="${width * 0.2}" height="${height * 0.7}" x="${width * 0.4}" fill="${color}"/>
            </svg>
        `;
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    initControls() {
        // Стрельба - только когда курсор захвачен
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0 && document.pointerLockElement) { // ЛКМ
                this.shoot();
            }
        });

        // Перезарядка и смена оружия
        document.addEventListener('keydown', (e) => {
            // Только когда курсор захвачен
            if (!document.pointerLockElement) return;

            if (e.code === 'KeyR') {
                this.reload();
            }

            // Смена оружия
            if (e.code === 'Digit1') {
                this.switchWeapon('pistol');
            } else if (e.code === 'Digit2') {
                this.switchWeapon('rifle');
            } else if (e.code === 'Digit3') {
                this.switchWeapon('sniper');
            }
        });
    }

    shoot() {
        const weapon = this.weapons[this.currentWeapon];

        // Проверки возможности выстрела
        if (!this.canShoot || this.isReloading || this.currentAmmo <= 0) {
            if (this.currentAmmo <= 0 && !this.isReloading) {
                this.reload();
            }
            return;
        }

        // Расход патрона
        this.currentAmmo--;
        this.canShoot = false;
        this.shootCooldown = weapon.fireRate;

        // Анимация отдачи
        this.weaponSpriteElement.classList.add('shoot');
        setTimeout(() => {
            this.weaponSpriteElement.classList.remove('shoot');
        }, 100);

        // Raycasting с разбросом
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);

        // Добавляем случайный разброс
        direction.x += (Math.random() - 0.5) * weapon.spread;
        direction.y += (Math.random() - 0.5) * weapon.spread;
        direction.normalize();

        this.raycaster.set(this.camera.position, direction);

        // Проверка попаданий
        const colliders = this.map.getColliders();
        const intersects = this.raycaster.intersectObjects(colliders, true);

        if (intersects.length > 0) {
            const hit = intersects[0];
            
            // Проверяем попадание по врагу
            if (hit.object.userData && hit.object.userData.isEnemy) {
                const enemyId = hit.object.userData.enemyId;
                const killed = this.map.damageEnemy(enemyId, weapon.damage);
                
                // Визуальная обратная связь о попадании
                this.showHitMarker();
                
                if (killed) {
                    // Можно добавить специальный эффект при убийстве
                    console.log('KILL!');
                }
            } else {
                // Попадание по окружению
                this.createBulletHole(hit.point, hit.face.normal);
            }

            // Тряска экрана
            this.screenShake();

            console.log('Попадание!', hit.distance.toFixed(2) + 'm');
        }

        // Обновление UI
        this.updateUI();
    }

    reload() {
        const weapon = this.weapons[this.currentWeapon];

        if (this.isReloading || this.currentAmmo === weapon.maxAmmo || this.reserveAmmo <= 0) {
            return;
        }

        this.isReloading = true;
        this.reloadMessageElement.classList.remove('hidden');

        // Анимация перезарядки
        this.weaponSpriteElement.classList.add('reload');

        setTimeout(() => {
            const ammoNeeded = weapon.maxAmmo - this.currentAmmo;
            const ammoToReload = Math.min(ammoNeeded, this.reserveAmmo);

            this.currentAmmo += ammoToReload;
            this.reserveAmmo -= ammoToReload;

            this.isReloading = false;
            this.weaponSpriteElement.classList.remove('reload');
            this.reloadMessageElement.classList.add('hidden');

            this.updateUI();
            console.log('Перезарядка завершена');
        }, weapon.reloadTime * 1000);
    }

    switchWeapon(weaponKey) {
        if (this.isReloading || weaponKey === this.currentWeapon) {
            return;
        }

        this.currentWeapon = weaponKey;
        const weapon = this.weapons[weaponKey];

        this.currentAmmo = weapon.maxAmmo;
        this.reserveAmmo = weapon.reserveAmmo;

        this.updateUI();
        this.updateWeaponSprite();
        this.updateWeaponSlots();

        console.log('Выбрано оружие:', weapon.name);
    }

    updateWeaponSlots() {
        // Обновляем подсветку слотов оружия
        const slots = document.querySelectorAll('.weapon-slot');
        slots.forEach((slot, index) => {
            slot.classList.remove('active');
        });

        let slotIndex = 0;
        if (this.currentWeapon === 'pistol') slotIndex = 0;
        else if (this.currentWeapon === 'rifle') slotIndex = 1;
        else if (this.currentWeapon === 'sniper') slotIndex = 2;

        if (slots[slotIndex]) {
            slots[slotIndex].classList.add('active');
        }
    }

    createBulletHole(position, normal) {
        // Создание декали следа от пули
        const geometry = new THREE.PlaneGeometry(0.1, 0.1);
        const material = new THREE.MeshBasicMaterial({
            color: 0x222222,
            transparent: true,
            opacity: 0.7,
            depthWrite: false
        });

        const bulletHole = new THREE.Mesh(geometry, material);
        
        // Позиционирование немного впереди поверхности
        bulletHole.position.copy(position);
        bulletHole.position.add(normal.multiplyScalar(0.01));

        // Поворот в сторону нормали
        bulletHole.lookAt(position.clone().add(normal));

        this.scene.add(bulletHole);
        this.bulletHoles.push(bulletHole);

        // Удаление старых следов
        if (this.bulletHoles.length > this.maxBulletHoles) {
            const oldHole = this.bulletHoles.shift();
            this.scene.remove(oldHole);
            oldHole.geometry.dispose();
            oldHole.material.dispose();
        }
    }

    showHitMarker() {
        this.hitMarkerElement.classList.remove('hidden');
        setTimeout(() => {
            this.hitMarkerElement.classList.add('hidden');
        }, 200);
    }

    screenShake() {
        document.body.classList.add('screen-shake');
        setTimeout(() => {
            document.body.classList.remove('screen-shake');
        }, 300);
    }

    updateUI() {
        this.ammoValueElement.textContent = this.currentAmmo;
        this.reserveValueElement.textContent = this.reserveAmmo;
        this.weaponNameElement.textContent = this.weapons[this.currentWeapon].name;
    }

    updateWeaponSprite() {
        const weapon = this.weapons[this.currentWeapon];
        this.weaponSpriteElement.style.backgroundImage = `url(${weapon.sprite})`;
    }

    update(delta) {
        // Обновление кулдауна стрельбы
        if (!this.canShoot) {
            this.shootCooldown -= delta;
            if (this.shootCooldown <= 0) {
                this.canShoot = true;
            }
        }
    }
}
