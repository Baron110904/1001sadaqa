import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllPublic() {
    return this.prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  findAllAdmin() {
    return this.prisma.testimonial.findMany({ orderBy: { order: 'asc' } });
  }

  create(data: CreateTestimonialDto) {
    return this.prisma.testimonial.create({ data });
  }

  update(id: string, data: UpdateTestimonialDto) {
    return this.prisma.testimonial.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.testimonial.delete({ where: { id } });
  }
}
