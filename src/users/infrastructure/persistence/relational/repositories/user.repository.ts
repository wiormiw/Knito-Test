import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { FilterUserDto, SortUserDto } from '../../../../dto/query-user.dto';
import { User } from '../../../../domain/user';
import { UserRepository } from '../../user.repository';
import { UserMapper } from '../mappers/user.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { AppDataSource } from '../../../../../database/data-source';

@Injectable()
export class UsersRelationalRepository implements UserRepository {
  // constructor(
  //   @InjectRepository(UserEntity)
  //   private readonly usersRepository: Repository<UserEntity>,
  // ) {}

  async create(data: User): Promise<User> {
    const persistenceModel = UserMapper.toPersistence(data);
    // const newEntity = await this.usersRepository.save(
    //   this.usersRepository.create(persistenceModel),
    // );

    // return UserMapper.toDomain(newEntity);

    // RAW SQL
    const result = await AppDataSource.query(
      `
        INSERT INTO "user" (
          email,
          password,
          provider,
          "socialId",
          "firstName",
          "lastName",
          "photoId",
          "roleId",
          "statusId"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `,
      [
        persistenceModel.email,
        persistenceModel.password,
        persistenceModel.provider,
        persistenceModel.socialId,
        persistenceModel.firstName,
        persistenceModel.lastName,
        persistenceModel.photo?.id ?? null,
        persistenceModel.role?.id ?? null,
        persistenceModel.status?.id ?? null,
      ],
    );

    // Newly created user
    const createdUser = await AppDataSource.query(
      `
        SELECT
          u.*,
          r.id as "roleId",
          r.name as "roleName"
        FROM "user" u
        LEFT JOIN "role" r ON u."roleId" = r.id
        WHERE u.id = $1
      `,
      [result[0].id],
    );

    return UserMapper.toDomain(createdUser[0]);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]> {
    // const where: FindOptionsWhere<UserEntity> = {};
    // if (filterOptions?.roles?.length) {
    //   where.role = filterOptions.roles.map((role) => ({
    //     id: Number(role.id),
    //   }));
    // }

    // const entities = await this.usersRepository.find({
    //   skip: (paginationOptions.page - 1) * paginationOptions.limit,
    //   take: paginationOptions.limit,
    //   where: where,
    //   order: sortOptions?.reduce(
    //     (accumulator, sort) => ({
    //       ...accumulator,
    //       [sort.orderBy]: sort.order,
    //     }),
    //     {},
    //   ),
    // });

    // return entities.map((user) => UserMapper.toDomain(user));

    // RAW SQL
    const params: any[] = [];
    const whereClauses: string[] = [];

    // Filter
    if (filterOptions?.roles?.length) {
      const roleIds = filterOptions.roles.map((r) => Number(r.id));
      whereClauses.push(`u."roleId" = ANY($${params.length + 1})`);
      params.push(roleIds);
    }

    // Sorting
    const orderClause = sortOptions?.length
      ? `ORDER BY ${sortOptions
          .map((s, _) => `u."${s.orderBy}" ${s.order.toUpperCase()}`)
          .join(', ')}`
      : '';

    const offset = (paginationOptions.page - 1) * paginationOptions.limit;
    const limit = paginationOptions.limit;

    const query = `
      SELECT
        u.*,
        r.id as "roleId",
        r.name as "roleName"
      FROM "user" u
      LEFT JOIN "role" r ON u."roleId" = r.id
      ${whereClauses.length ? 'WHERE' + whereClauses.join(' AND ') : ''}
      ${orderClause}
      OFFSET $${params.length + 1}
      LIMIT $${params.length + 2};
    `;

    params.push(offset, limit);

    const rows = await AppDataSource.query(query, params);
    return rows.map(UserMapper.toDomain);
  }

  async findById(id: User['id']): Promise<NullableType<User>> {
    // const entity = await this.usersRepository.findOne({
    //   where: { id: Number(id) },
    // });

    // return entity ? UserMapper.toDomain(entity) : null;

    // RAW SQL
    const rows = await AppDataSource.query(
      `
        SELECT
          u.*,
          r.id as "roleId",
          r.name as "roleName"
        FROM "user" u
        LEFT JOIN "role" r ON u."roleId" = r.id
        WHERE u.id = $1
      `,
      [id],
    );

    return rows[0] ? UserMapper.toDomain(rows[0]) : null;
  }

  async findByIds(ids: User['id'][]): Promise<User[]> {
    // const entities = await this.usersRepository.find({
    //   where: { id: In(ids) },
    // });

    // return entities.map((user) => UserMapper.toDomain(user));

    // RAW SQL
    if (!ids.length) return [];

    const rows = await AppDataSource.query(
      `
        SELECT
          u.*,
          r.id as "roleId",
          r.name as "roleName"
        FROM "user" u
        LEFT JOIN "role" r ON u."roleId" = r.id
        WHERE id = ANY($1)
      `,
      [ids],
    );

    return rows.map(UserMapper.toDomain);
  }

  async findByEmail(email: User['email']): Promise<NullableType<User>> {
    if (!email) return null;

    // const entity = await this.usersRepository.findOne({
    //   where: { email },
    // });

    // return entity ? UserMapper.toDomain(entity) : null;

    // RAW SQL
    const rows = await AppDataSource.query(
      `
        SELECT
          u.*,
          r.id as "roleId",
          r.name as "roleName"
        FROM "user" u
        LEFT JOIN "role" r ON u."roleId" = r.id
        WHERE u.email = $1
      `,
      [email],
    );

    return rows[0] ? UserMapper.toDomain(rows[0]) : null;
  }

  async findBySocialIdAndProvider({
    socialId,
    provider,
  }: {
    socialId: User['socialId'];
    provider: User['provider'];
  }): Promise<NullableType<User>> {
    if (!socialId || !provider) return null;

    // const entity = await this.usersRepository.findOne({
    //   where: { socialId, provider },
    // });

    // return entity ? UserMapper.toDomain(entity) : null;

    // RAW SQL
    const rows = await AppDataSource.query(
      `
        SELECT
          u.*,
          r.id as "roleId",
          r.name as "roleName"
        FROM "user" u
        LEFT JOIN "role" ON u."roleId" = r.id
        WHERE u."socialId" = $1 AND u.provider = $2
      `,
      [socialId, provider],
    );

    return rows[0] ? UserMapper.toDomain(rows[0]) : null;
  }

  async update(id: User['id'], payload: Partial<User>): Promise<User> {
    // const entity = await this.usersRepository.findOne({
    //   where: { id: Number(id) },
    // });

    const entity = await this.findById(id);

    if (!entity) {
      throw new Error('User not found');
    }

    // const updatedEntity = await this.usersRepository.save(
    //   this.usersRepository.create(
    //     UserMapper.toPersistence({
    //       ...UserMapper.toDomain(entity),
    //       ...payload,
    //     }),
    //   ),
    // );

    // return UserMapper.toDomain(updatedEntity);

    // RAW SQL
    const updated = {
      ...entity,
      // ...payload,
      role: payload.role ?? entity.role,
      status: payload.status ?? entity.status,
      photo: payload.photo ?? entity.photo,
      provider: payload.provider ?? entity.provider,
      socialId: payload.socialId ?? entity.socialId,
    };

    const persistence = UserMapper.toPersistence(updated);

    const updatedUser = await AppDataSource.query(
      `
        WITH updated_user AS (
            UPDATE "user"
            SET
                email = $1,
                password = $2,
                provider = $3,
                "socialId" = $4,
                "firstName" = $5,
                "lastName" = $6,
                "photoId" = $7,
                "roleId" = $8,
                "statusId" = $9,
                "updatedAt" = NOW()
            WHERE id = $10
            RETURNING *
        )
        SELECT
            u.*,
            r.id as "roleId",
            r.name as "roleName",
            s.id as "statusId",
            s.name as "statusName",
            p.id as "photoId",
            p.path as "photoUrl"
        FROM updated_user u
        LEFT JOIN "role" r ON u."roleId" = r.id
        LEFT JOIN "status" s ON u."statusId" = s.id
        LEFT JOIN "file" p ON u."photoId" = p.id
        `,
      [
        persistence.email,
        persistence.password,
        persistence.provider,
        persistence.socialId,
        persistence.firstName,
        persistence.lastName,
        persistence.photo?.id ?? null,
        persistence.role?.id ?? null,
        persistence.status?.id ?? null,
        id,
      ],
    );

    if (updatedUser.length === 0) {
      throw new Error('User not found after update');
    }

    return UserMapper.toDomain(updatedUser[0]);
  }

  async remove(id: User['id']): Promise<void> {
    // await this.usersRepository.softDelete(id);

    // RAW SQL
    await AppDataSource.query(
      `UPDATE "user" SET "deletedAt" = NOW() WHERE id = $1`,
      [id],
    );
  }
}
