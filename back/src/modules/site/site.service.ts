import { Injectable } from '@nestjs/common';
import {} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Chiffres affichés dans les bandeaux d'impact du site. Les volumes de
 * programmes et de projets sont comptés en base pour rester justes sans
 * intervention ; les deux autres sont déclaratifs et réglés en back-office.
 */
@Injectable()
export class SiteService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [programs, projects, settings] = await this.prisma.$transaction([
      this.prisma.program.count({ where: { isActive: true } }),
      this.prisma.project.count({ where: { isPublished: true } }),
      this.prisma.setting.findMany({
        where: { key: { in: ['impact.peopleHelped', 'impact.communities'] } },
      }),
    ]);

    const byKey = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return {
      programs,
      projects,
      peopleHelped: Number(byKey['impact.peopleHelped'] ?? 0),
      communities: Number(byKey['impact.communities'] ?? 0),
    };
  }
}
