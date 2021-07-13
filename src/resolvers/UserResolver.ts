import { Arg, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { compare, hash } from 'bcryptjs'
import { User } from "../entity/User";
import { sign } from "jsonwebtoken";

@ObjectType()
class LoginResponse {
    @Field()
    accessToken: string
}

@Resolver()
export class UserResolver {
    @Query(() => String)
    hello() {
        return 'Hi!'
    }

    @Query(() => [User])
    users() {
        return User.find()
    }

    @Mutation(() => Boolean)
    async register(
        @Arg('firstName') firstName: string,
        @Arg('lastName') lastName: string,
        @Arg('email') email: string,
        @Arg('password') password: string,
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
        return true;
    }

    @Mutation(() => LoginResponse)
    async login(
        @Arg("email") email: string,
        @Arg("password") password: string,
    ): Promise<LoginResponse> {
        const user = await User.findOne({ where: { email } })

        if (!user) {
            throw new Error('user does not exist')
        }

        const valid = await compare(password, user.password)
        if (!valid) {
            throw new Error('wrong password')
        }

        return {
            accessToken: sign({ userId: user.id }, 'rahasia', {
                expiresIn: '15m'
            })
        };
    }
}