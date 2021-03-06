import { verify } from 'jsonwebtoken'
import { sendRefreshToken } from './../sendRefreshToken'
import { createAccessToken } from './../auth'
import {
  Arg,
  Ctx,
  Field,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql'
import { compare, hash } from 'bcryptjs'
import { User } from '../entity/User'
import { sign } from 'jsonwebtoken'
import { MyContext } from '../MyContext'
import { createRefreshToken } from '../auth'
import { isAuth } from '../isAuth'
import { getConnection } from 'typeorm'

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string
  @Field(() => User)
  user: User
}

@Resolver()
export class UserResolver {
  @Query(() => String)
  hello() {
    return 'Hi!'
  }

  @Query(() => String)
  @UseMiddleware(isAuth)
  bye(@Ctx() { payload }: MyContext) {
    return `Your user id is ${payload.userId}`
  }

  @Query(() => [User])
  users() {
    return User.find()
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() context: MyContext) {
    const authorization = context.req.headers['authorization']

    if (!authorization) {
      return null
    }

    try {
      const token = authorization.split(' ')[1]
      const payload: any = verify(token, process.env.ACCESS_TOKEN_SECRET)
      context.payload = payload as any
      return User.findOne(payload.userId)
    } catch (err) {
      console.log(err)
      return null
    }
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: MyContext) {
    sendRefreshToken(res, '')
    return true
  }

  @Mutation(() => Boolean)
  async revokeTokenUser(@Arg('userId', () => Int) userId: number) {
    await getConnection()
      .getRepository(User)
      .increment({ id: userId }, 'tokenVersion', 1)
    return true
  }

  @Mutation(() => Boolean)
  async register(
    @Arg('firstName') firstName: string,
    @Arg('lastName') lastName: string,
    @Arg('email') email: string,
    @Arg('password') password: string
  ) {
    const hashed = await hash(password, 12)

    try {
      await User.insert({
        firstName,
        lastName,
        email,
        password: hashed,
      })
    } catch (err) {
      console.log(err)
      return false
    }
    return true
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() { req, res }: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { email } })

    if (!user) {
      throw new Error('user does not exist')
    }

    const valid = await compare(password, user.password)
    if (!valid) {
      throw new Error('wrong password')
    }

    sendRefreshToken(res, createRefreshToken(user))

    return {
      accessToken: createAccessToken(user),
      user,
    }
  }
}
