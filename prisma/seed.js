const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.academicEvent.count();
  if (count === 0) {
    await prisma.academicEvent.createMany({
      data: [
        {
          title: 'Examen Tema 1: Acceso a Datos',
          type: 'exam',
          subjectId: 'sub-datos',
          date: '2026-09-25',
          time: '11:25',
          description: 'Mapeo objeto-relacional, conexiones JDBC y configuración de ficheros XML.',
          priority: 'high',
          isOfficial: true,
          authorName: 'Delegación DM2A',
        },
        {
          title: 'Práctica 1: Creación de Interfaces',
          type: 'assignment',
          subjectId: 'sub-interfaces',
          date: '2026-09-29',
          time: '23:59',
          description: 'Diseño responsive y componentes accesibles en Tailwind CSS.',
          priority: 'medium',
          isOfficial: false,
          authorName: 'Mario (Alumno)',
        },
      ],
    });
    console.log('Seeded sample academic events.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
