export class PlayerController {
    constructor(camera, map) {
        this.camera = camera;
        this.map = map;

        // Настройки движения
        this.moveSpeed = 5.0;
        this.jumpSpeed = 7.0;
        this.gravity = 20.0;
        this.mouseSensitivity = 0.002;

        // Состояние движения
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.isOnGround = false;

        // Размеры коллайдера игрока
        this.height = 1.7;
        this.radius = 0.4;

        // Управление
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = true;

        // Pointer Lock
        this.controls = {
            isLocked: false
        };

        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

        this.initControls();
    }

    initControls() {
        // Pointer Lock API
        const element = document.body;

        const onMouseMove = (event) => {
            if (!this.controls.isLocked) return;

            const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            this.euler.setFromQuaternion(this.camera.quaternion);

            this.euler.y -= movementX * this.mouseSensitivity;
            this.euler.x -= movementY * this.mouseSensitivity;

            // Ограничение вертикального поворота
            this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

            this.camera.quaternion.setFromEuler(this.euler);
        };

        const onPointerlockChange = () => {
            if (document.pointerLockElement === element) {
                this.controls.isLocked = true;
            } else {
                this.controls.isLocked = false;
            }
        };

        const onPointerlockError = () => {
            console.error('Ошибка Pointer Lock');
        };

        // Обработчики событий
        element.addEventListener('click', () => {
            element.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', onPointerlockChange);
        document.addEventListener('pointerlockerror', onPointerlockError);
        document.addEventListener('mousemove', onMouseMove);

        // Клавиатура
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(event) {
        // Проверяем что курсор захвачен
        if (!this.controls.isLocked) return;

        switch (event.code) {
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                if (this.canJump && this.isOnGround) {
                    this.velocity.y = this.jumpSpeed;
                    this.canJump = false;
                }
                break;
        }
    }

    onKeyUp(event) {
        // Проверяем что курсор захвачен
        if (!this.controls.isLocked) return;

        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
            case 'Space':
                this.canJump = true;
                break;
        }
    }

    checkCollision(position) {
        // Проверка столкновений с картой
        const colliders = this.map.getColliders();
        
        for (let collider of colliders) {
            // Простая проверка AABB коллизии
            const box = collider.geometry.boundingBox;
            if (!box) continue;

            const worldBox = box.clone();
            worldBox.translate(collider.position);

            // Проверка цилиндрической коллизии игрока с боксом
            const playerBox = new THREE.Box3(
                new THREE.Vector3(
                    position.x - this.radius,
                    position.y - this.height,
                    position.z - this.radius
                ),
                new THREE.Vector3(
                    position.x + this.radius,
                    position.y,
                    position.z + this.radius
                )
            );

            if (playerBox.intersectsBox(worldBox)) {
                return true;
            }
        }

        return false;
    }

    update(delta) {
        if (!this.controls.isLocked) return;

        // Применение гравитации
        this.velocity.y -= this.gravity * delta;

        // Определение направления движения
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        // Вычисление скорости
        const speed = this.moveSpeed * delta;

        if (this.moveForward || this.moveBackward) {
            this.velocity.z -= this.direction.z * speed;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x -= this.direction.x * speed;
        }

        // Применение затухания для плавной остановки
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;

        // Вычисление новой позиции
        const newPosition = this.camera.position.clone();
        
        // Перемещение в мировых координатах
        const moveVector = new THREE.Vector3();
        moveVector.setFromMatrixColumn(this.camera.matrix, 0); // Правый вектор
        moveVector.multiplyScalar(-this.velocity.x);
        
        const forwardVector = new THREE.Vector3();
        forwardVector.setFromMatrixColumn(this.camera.matrix, 2); // Вектор назад
        forwardVector.multiplyScalar(-this.velocity.z);

        newPosition.add(moveVector);
        newPosition.add(forwardVector);

        // Вертикальное движение
        newPosition.y += this.velocity.y * delta;

        // Проверка коллизий
        if (!this.checkCollision(newPosition)) {
            this.camera.position.copy(newPosition);
        } else {
            // Если столкновение, останавливаем горизонтальное движение
            this.velocity.x = 0;
            this.velocity.z = 0;
        }

        // Проверка на земле
        const groundCheckPos = this.camera.position.clone();
        groundCheckPos.y -= 0.1;

        if (this.checkCollision(groundCheckPos) || this.camera.position.y <= 0.1) {
            this.isOnGround = true;
            this.velocity.y = 0;
            
            // Коррекция позиции, если ушли под землю
            if (this.camera.position.y < 1.7) {
                this.camera.position.y = 1.7;
            }
        } else {
            this.isOnGround = false;
        }

        // Ограничение падения за карту
        if (this.camera.position.y < -10) {
            this.respawn();
        }
    }

    respawn() {
        // Возврат на стартовую позицию
        this.camera.position.set(0, 1.7, 0);
        this.velocity.set(0, 0, 0);
        console.log('Игрок возрожден');
    }

    lock() {
        document.body.requestPointerLock();
    }

    unlock() {
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }

    getPosition() {
        return this.camera.position;
    }

    getDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }
}
