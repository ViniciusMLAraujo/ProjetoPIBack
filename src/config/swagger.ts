import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'University Access API',
      version: '1.0.0',
      description:
        'API de controle de acesso universitário via IoT + QR Code. ' +
        'Gerencia autenticação, alunos, cursos, salas, horários, QR Codes e registros de acesso.',
    },
    servers: [
      { url: 'http://localhost:3100', description: 'Desenvolvimento' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // ── Enums ──────────────────────────────────────────────────────────────
        Role: {
          type: 'string',
          enum: ['ADMIN', 'PROFESSOR', 'STUDENT'],
        },
        Concept: {
          type: 'string',
          enum: ['NS', 'ANS', 'BOM', 'OTIMO', 'EXCELENTE'],
        },

        // ── Auth ───────────────────────────────────────────────────────────────
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@campus.edu' },
            password: { type: 'string', minLength: 6, example: 'senha123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                role: { $ref: '#/components/schemas/Role' },
              },
            },
          },
        },
        MeResponse: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                userId: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                role: { $ref: '#/components/schemas/Role' },
              },
            },
          },
        },

        // ── Student ────────────────────────────────────────────────────────────
        CreateStudentRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'enrollment'],
          properties: {
            name: { type: 'string', minLength: 3, example: 'João Silva' },
            email: { type: 'string', format: 'email', example: 'joao@campus.edu' },
            password: { type: 'string', minLength: 6, example: 'senha123' },
            enrollment: { type: 'string', example: '2024001' },
          },
        },
        EnrollStudentRequest: {
          type: 'object',
          required: ['courseId'],
          properties: {
            courseId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
          },
        },
        Student: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            enrollment: { type: 'string' },
            userId: { type: 'string', format: 'uuid' },
          },
        },

        // ── Course ─────────────────────────────────────────────────────────────
        CreateCourseRequest: {
          type: 'object',
          required: ['name', 'code'],
          properties: {
            name: { type: 'string', minLength: 3, example: 'Engenharia de Software' },
            code: { type: 'string', example: 'ES101' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            code: { type: 'string' },
          },
        },

        // ── Room ───────────────────────────────────────────────────────────────
        CreateRoomRequest: {
          type: 'object',
          required: ['name', 'capacity'],
          properties: {
            name: { type: 'string', example: 'Sala A101' },
            capacity: { type: 'integer', example: 40 },
          },
        },
        UpdateRoomRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Sala A101' },
            capacity: { type: 'integer', example: 40 },
          },
        },
        Room: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            capacity: { type: 'integer' },
          },
        },

        // ── Schedule ───────────────────────────────────────────────────────────
        CreateScheduleRequest: {
          type: 'object',
          required: ['courseId', 'roomId', 'dayOfWeek', 'startTime', 'endTime'],
          properties: {
            courseId: { type: 'string', format: 'uuid' },
            roomId: { type: 'string', format: 'uuid' },
            dayOfWeek: { type: 'integer', minimum: 0, maximum: 6, description: '0 = Domingo, 6 = Sábado' },
            startTime: { type: 'string', example: '08:00' },
            endTime: { type: 'string', example: '10:00' },
          },
        },
        Schedule: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            courseId: { type: 'string', format: 'uuid' },
            roomId: { type: 'string', format: 'uuid' },
            dayOfWeek: { type: 'integer' },
            startTime: { type: 'string' },
            endTime: { type: 'string' },
          },
        },

        // ── QRCode ─────────────────────────────────────────────────────────────
        GenerateQRCodeRequest: {
          type: 'object',
          required: ['scheduleId'],
          properties: {
            scheduleId: { type: 'string', format: 'uuid' },
          },
        },
        GenerateQRCodeResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'uuid-token-aqui' },
            qrCodeBase64: { type: 'string', description: 'Imagem do QR Code em base64 (PNG)' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
        ValidateQRCodeRequest: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string', example: 'uuid-token-aqui' },
          },
        },
        QRCodeStatusResponse: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            expiresAt: { type: 'string', format: 'date-time' },
            usedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        QRValidateResponse: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['OPEN', 'DENY'] },
            reason: { type: 'string' },
            studentId: { type: 'string', format: 'uuid' },
          },
        },

        // ── Access ─────────────────────────────────────────────────────────────
        AccessLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid' },
            qrTokenId: { type: 'string', format: 'uuid' },
            enteredAt: { type: 'string', format: 'date-time' },
            exitAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },

        // ── Errors ─────────────────────────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Mensagem de erro' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],

    paths: {
      // ── Health ──────────────────────────────────────────────────────────────
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check da API',
          security: [],
          responses: {
            '200': {
              description: 'API online',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ── Auth ────────────────────────────────────────────────────────────────
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login e obtenção de token JWT',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
            },
          },
          responses: {
            '200': {
              description: 'Login realizado com sucesso',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } },
              },
            },
            '400': { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '401': { description: 'Credenciais incorretas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '429': { description: 'Muitas tentativas de login (rate limit)' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Retorna o usuário autenticado',
          responses: {
            '200': {
              description: 'Dados do usuário logado',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/MeResponse' } },
              },
            },
            '401': { description: 'Token ausente ou inválido' },
          },
        },
      },

      // ── Students ────────────────────────────────────────────────────────────
      '/api/students': {
        get: {
          tags: ['Students'],
          summary: 'Lista todos os alunos',
          description: '**Roles:** ADMIN, PROFESSOR',
          responses: {
            '200': {
              description: 'Lista de alunos',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Student' } },
                },
              },
            },
            '401': { description: 'Não autenticado' },
            '403': { description: 'Sem permissão' },
          },
        },
        post: {
          tags: ['Students'],
          summary: 'Cria um novo aluno',
          description: '**Roles:** ADMIN',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateStudentRequest' } },
            },
          },
          responses: {
            '201': {
              description: 'Aluno criado',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Student' } } },
            },
            '400': { description: 'Dados inválidos' },
            '409': { description: 'Email ou matrícula já existente' },
          },
        },
      },
      '/api/students/me': {
        get: {
          tags: ['Students'],
          summary: 'Perfil e horários do aluno logado',
          description: '**Roles:** STUDENT',
          responses: {
            '200': { description: 'Perfil do aluno com horários' },
            '404': { description: 'Aluno não encontrado' },
          },
        },
      },
      '/api/students/{id}': {
        get: {
          tags: ['Students'],
          summary: 'Busca aluno por ID',
          description: '**Roles:** ADMIN, PROFESSOR',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': { description: 'Dados do aluno', content: { 'application/json': { schema: { $ref: '#/components/schemas/Student' } } } },
            '404': { description: 'Aluno não encontrado' },
          },
        },
      },
      '/api/students/{id}/enroll': {
        post: {
          tags: ['Students'],
          summary: 'Matricula um aluno em um curso',
          description: '**Roles:** ADMIN',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/EnrollStudentRequest' } },
            },
          },
          responses: {
            '201': { description: 'Matrícula realizada com sucesso' },
            '400': { description: 'Dados inválidos' },
            '409': { description: 'Aluno já matriculado neste curso' },
          },
        },
      },

      // ── Courses ─────────────────────────────────────────────────────────────
      '/api/courses': {
        get: {
          tags: ['Courses'],
          summary: 'Lista todos os cursos',
          description: '**Roles:** qualquer usuário autenticado',
          responses: {
            '200': {
              description: 'Lista de cursos',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Course' } } } },
            },
          },
        },
        post: {
          tags: ['Courses'],
          summary: 'Cria um novo curso',
          description: '**Roles:** ADMIN',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateCourseRequest' } },
            },
          },
          responses: {
            '201': { description: 'Curso criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Course' } } } },
            '400': { description: 'Dados inválidos' },
            '409': { description: 'Código de curso já existente' },
          },
        },
      },
      '/api/courses/{id}': {
        get: {
          tags: ['Courses'],
          summary: 'Busca curso por ID',
          description: '**Roles:** qualquer usuário autenticado',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': { description: 'Dados do curso', content: { 'application/json': { schema: { $ref: '#/components/schemas/Course' } } } },
            '404': { description: 'Curso não encontrado' },
          },
        },
      },

      // ── Rooms ───────────────────────────────────────────────────────────────
      '/api/rooms': {
        get: {
          tags: ['Rooms'],
          summary: 'Lista todas as salas',
          description: '**Roles:** qualquer usuário autenticado',
          responses: {
            '200': {
              description: 'Lista de salas',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Room' } } } },
            },
          },
        },
        post: {
          tags: ['Rooms'],
          summary: 'Cria uma nova sala',
          description: '**Roles:** qualquer usuário autenticado',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateRoomRequest' } },
            },
          },
          responses: {
            '201': { description: 'Sala criada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
            '400': { description: 'Dados inválidos' },
          },
        },
      },
      '/api/rooms/{id}': {
        get: {
          tags: ['Rooms'],
          summary: 'Busca sala por ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': { description: 'Dados da sala', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
            '404': { description: 'Sala não encontrada' },
          },
        },
        put: {
          tags: ['Rooms'],
          summary: 'Atualiza uma sala',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UpdateRoomRequest' } },
            },
          },
          responses: {
            '200': { description: 'Sala atualizada' },
            '404': { description: 'Sala não encontrada' },
          },
        },
        delete: {
          tags: ['Rooms'],
          summary: 'Remove uma sala',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '204': { description: 'Sala removida' },
            '404': { description: 'Sala não encontrada' },
          },
        },
      },

      // ── Schedules ───────────────────────────────────────────────────────────
      '/api/schedules': {
        get: {
          tags: ['Schedules'],
          summary: 'Lista todos os horários',
          description: '**Roles:** qualquer usuário autenticado',
          responses: {
            '200': {
              description: 'Lista de horários',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Schedule' } } } },
            },
          },
        },
        post: {
          tags: ['Schedules'],
          summary: 'Cria um novo horário',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateScheduleRequest' } },
            },
          },
          responses: {
            '201': { description: 'Horário criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Schedule' } } } },
            '400': { description: 'Dados inválidos' },
          },
        },
      },
      '/api/schedules/{id}': {
        get: {
          tags: ['Schedules'],
          summary: 'Busca horário por ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': { description: 'Dados do horário' },
            '404': { description: 'Horário não encontrado' },
          },
        },
        put: {
          tags: ['Schedules'],
          summary: 'Atualiza um horário',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateScheduleRequest' } },
            },
          },
          responses: {
            '200': { description: 'Horário atualizado' },
            '404': { description: 'Horário não encontrado' },
          },
        },
        delete: {
          tags: ['Schedules'],
          summary: 'Remove um horário',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '204': { description: 'Horário removido' },
            '404': { description: 'Horário não encontrado' },
          },
        },
      },

      // ── QR Code ─────────────────────────────────────────────────────────────
      '/api/qrcode/generate': {
        post: {
          tags: ['QR Code'],
          summary: 'Gera um QR Code para entrada na catraca',
          description: '**Roles:** STUDENT — o aluno gera seu próprio token para um horário.',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/GenerateQRCodeRequest' } },
            },
          },
          responses: {
            '201': {
              description: 'QR Code gerado',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/GenerateQRCodeResponse' } } },
            },
            '400': { description: 'scheduleId ausente ou aluno não matriculado' },
          },
        },
      },
      '/api/qrcode/validate': {
        post: {
          tags: ['QR Code'],
          summary: 'Valida um token QR Code via REST (admin/testes)',
          description: '**Roles:** ADMIN — O fluxo real de validação usa MQTT (ESP32).',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ValidateQRCodeRequest' } },
            },
          },
          responses: {
            '200': {
              description: 'Token válido — catraca liberada (OPEN)',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/QRValidateResponse' } } },
            },
            '403': {
              description: 'Token inválido, expirado ou já usado (DENY)',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/QRValidateResponse' } } },
            },
          },
        },
      },
      '/api/qrcode/status/{token}': {
        get: {
          tags: ['QR Code'],
          summary: 'Verifica validade do token sem consumi-lo',
          description: 'Usado pelo app para exibir contador regressivo de expiração.',
          parameters: [
            { name: 'token', in: 'path', required: true, schema: { type: 'string' }, description: 'UUID do token QR' },
          ],
          responses: {
            '200': {
              description: 'Status do token',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/QRCodeStatusResponse' } } },
            },
          },
        },
      },
      '/api/qrcode/scan-image': {
        post: {
          tags: ['QR Code'],
          summary: 'Recebe imagem da ESP32, decodifica e valida o QR Code',
          description:
            'Endpoint chamado pela ESP32. Autenticação via header `X-Device-Key` ' +
            '(não usa JWT). Aceita `multipart/form-data` com o campo `image`.',
          security: [],
          parameters: [
            {
              name: 'X-Device-Key',
              in: 'header',
              required: false,
              schema: { type: 'string' },
              description: 'Chave de dispositivo configurada em ESP32_DEVICE_KEY no .env',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['image'],
                  properties: {
                    image: { type: 'string', format: 'binary', description: 'Imagem JPEG ou PNG com o QR Code (máx 5 MB)' },
                    deviceId: { type: 'string', example: 'esp32-catraca-01' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'QR válido — catraca liberada', content: { 'application/json': { schema: { $ref: '#/components/schemas/QRValidateResponse' } } } },
            '400': { description: 'Imagem sem QR, ilegível ou token inválido' },
            '401': { description: 'Chave de dispositivo inválida' },
            '403': { description: 'Token expirado ou já utilizado' },
          },
        },
      },

      // ── Access ──────────────────────────────────────────────────────────────
      '/api/access/{id}/exit': {
        patch: {
          tags: ['Access'],
          summary: 'Registra a saída do aluno',
          description: '**Roles:** ADMIN, PROFESSOR',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'ID do AccessLog' },
          ],
          responses: {
            '200': { description: 'Saída registrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/AccessLog' } } } },
            '404': { description: 'Registro não encontrado' },
          },
        },
      },
      '/api/access/students/{studentId}/history': {
        get: {
          tags: ['Access'],
          summary: 'Histórico de acessos do aluno',
          description: 'STUDENT vê apenas o próprio histórico. ADMIN e PROFESSOR podem ver qualquer aluno.',
          parameters: [
            { name: 'studentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Lista de acessos',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AccessLog' } } } },
            },
            '403': { description: 'STUDENT tentando ver histórico de outro aluno' },
          },
        },
      },
      '/api/access/students/{studentId}/attendance/{courseId}': {
        get: {
          tags: ['Access'],
          summary: 'Presenças e faltas do aluno em um curso',
          parameters: [
            { name: 'studentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'courseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': { description: 'Relatório de frequência' },
          },
        },
      },
      '/api/access/recent': {
        get: {
          tags: ['Access'],
          summary: 'Últimos acessos (dashboard admin)',
          description: '**Roles:** ADMIN',
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 }, description: 'Máximo de registros a retornar' },
          ],
          responses: {
            '200': {
              description: 'Acessos recentes',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AccessLog' } } } },
            },
            '403': { description: 'Sem permissão' },
          },
        },
      },
    },
  },
  apis: [], // paths definidos diretamente no definition acima
}

export const swaggerSpec = swaggerJsdoc(options)